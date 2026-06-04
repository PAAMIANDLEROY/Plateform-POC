import os
import logging
from fastapi import APIRouter, HTTPException, Response, Cookie, status
from pydantic import BaseModel, EmailStr
from typing import Optional

from core.security import create_access_token, create_refresh_token, decode_token
from core.store import store, CurrentUser
from core.deps import get_current_user
from fastapi import Depends
from services.email import send_otp_email
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
ACCESS_COOKIE = "access_token"

# ── Allowed domains ───────────────────────────────────────────────────────────

def _load_allowed_domains() -> set[str]:
    path = os.path.join(os.path.dirname(__file__), "..", "allowed_domains.txt")
    path = os.path.normpath(path)
    try:
        with open(path, "r") as f:
            return {line.strip().lstrip("@").lower() for line in f if line.strip()}
    except FileNotFoundError:
        logger.warning("allowed_domains.txt not found — falling back to env config")
        return set(settings.allowed_domains_list)

def _is_domain_allowed(email: str) -> bool:
    domain = email.split("@")[-1].lower()
    return domain in _load_allowed_domains()


# ── Schemas ───────────────────────────────────────────────────────────────────

class RequestCodeBody(BaseModel):
    email: EmailStr

class VerifyCodeBody(BaseModel):
    email: EmailStr
    code: str

class UserOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    school: str
    bio: str
    avatar_url: Optional[str]
    linkedin: str
    github: str
    is_profile_complete: bool

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    is_new: bool

class MessageResponse(BaseModel):
    message: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_out(user_data: dict) -> UserOut:
    cu = CurrentUser(user_data)
    return UserOut(
        id=cu.id,
        email=cu.email,
        first_name=cu.first_name,
        last_name=cu.last_name,
        role=cu.role,
        is_verified=cu.is_verified,
        school=cu.school,
        bio=cu.bio,
        avatar_url=cu.avatar_url,
        linkedin=cu.linkedin,
        github=cu.github,
        is_profile_complete=cu.is_profile_complete,
    )

def _set_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(ACCESS_COOKIE, access_token, httponly=True, secure=False, samesite="lax",
                        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(REFRESH_COOKIE, refresh_token, httponly=True, secure=False, samesite="lax",
                        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, path="/api/v1/auth/refresh")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/request-code", response_model=MessageResponse)
def request_code(body: RequestCodeBody):
    """Step 1 — validate domain, generate OTP, send email."""
    email = body.email.lower()

    if not _is_domain_allowed(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adresse email non autorisée. Utilisez votre email institutionnel.",
        )

    code = store.create_otp(email)
    send_otp_email(email, code)
    logger.info("OTP sent to %s: %s", email, code)  # visible in server logs during dev

    return {"message": f"Code envoyé à {email}. Vérifiez votre boîte mail."}


@router.post("/verify-code", response_model=AuthResponse)
def verify_code(body: VerifyCodeBody, response: Response):
    """Step 2 — verify OTP, create/retrieve user, issue JWT."""
    email = body.email.lower()

    if not store.verify_otp(email, body.code.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code invalide ou expiré.",
        )

    user_data, is_new = store.get_or_create(email)

    access_token = create_access_token(user_data["id"])
    refresh_token = create_refresh_token(user_data["id"])
    user_data["refresh_token"] = refresh_token

    _set_cookies(response, access_token, refresh_token)

    return AuthResponse(
        access_token=access_token,
        user=_user_out(user_data),
        is_new=is_new,
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_data = store.get_by_id(payload["sub"])
    if not user_data or user_data.get("refresh_token") != refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée")

    new_access = create_access_token(user_data["id"])
    new_refresh = create_refresh_token(user_data["id"])
    user_data["refresh_token"] = new_refresh

    _set_cookies(response, new_access, new_refresh)

    return AuthResponse(
        access_token=new_access,
        user=_user_out(user_data),
        is_new=False,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response, current_user: CurrentUser = Depends(get_current_user)):
    user_data = store.get_by_id(current_user.id)
    if user_data:
        user_data.pop("refresh_token", None)

    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth/refresh")

    return {"message": "Déconnecté avec succès."}
