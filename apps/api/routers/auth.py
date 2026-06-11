import uuid
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Response, Cookie, status, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from core.security import create_access_token, create_refresh_token, decode_token
from core.store import CurrentUser
from core.deps import get_current_user
from core.domains import is_domain_allowed
from core.user_utils import user_to_current
from core.config import settings
from database import get_db
from models.user import User, UserRole
from models.learning import Otp
from services.email import send_otp_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
ACCESS_COOKIE = "access_token"
OTP_EXPIRE_MINUTES = 10


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

def _user_out(cu: CurrentUser) -> UserOut:
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
    # Cross-origin (prod): SameSite=None + Secure=True required by browsers.
    # Same-origin (dev):   SameSite=Lax  + Secure=False (HTTP localhost).
    _secure = settings.COOKIE_SECURE
    _samesite = "none" if _secure else "lax"

    response.set_cookie(
        ACCESS_COOKIE, access_token,
        httponly=True, secure=_secure, samesite=_samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        REFRESH_COOKIE, refresh_token,
        httponly=True, secure=_secure, samesite=_samesite,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth/refresh",
    )

def _get_or_create_user(db: Session, email: str) -> tuple[User, bool]:
    """Return (user, is_new). Creates a new student if email not found."""
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user, False

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        first_name="",
        last_name="",
        hashed_password="",  # OTP auth — no password
        role=UserRole.student,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/request-code", response_model=MessageResponse)
def request_code(body: RequestCodeBody, db: Session = Depends(get_db)):
    """Step 1 — validate domain, generate OTP, persist to DB, send email."""
    email = body.email.lower()

    if not is_domain_allowed(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adresse email non autorisée. Utilisez votre email institutionnel.",
        )

    # Delete any existing OTPs for this email (1 active OTP per email)
    db.query(Otp).filter(Otp.email == email).delete()

    code = str(random.randint(100_000, 999_999))
    otp = Otp(
        id=str(uuid.uuid4()),
        email=email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    db.commit()

    send_otp_email(email, code)
    logger.info("OTP sent to %s (code visible in dev logs): %s", email, code)

    return {"message": f"Code envoyé à {email}. Vérifiez votre boîte mail."}


@router.post("/verify-code", response_model=AuthResponse)
def verify_code(body: VerifyCodeBody, response: Response, db: Session = Depends(get_db)):
    """Step 2 — verify OTP, create/retrieve user, issue JWT."""
    email = body.email.lower()
    now = datetime.now(timezone.utc)

    otp = db.query(Otp).filter(
        Otp.email == email,
        Otp.code == body.code.strip(),
        Otp.expires_at > now,
    ).first()

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code invalide ou expiré.",
        )

    db.delete(otp)
    db.commit()

    user, is_new = _get_or_create_user(db, email)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    user.refresh_token = refresh_token
    db.commit()

    _set_cookies(response, access_token, refresh_token)

    return AuthResponse(
        access_token=access_token,
        user=_user_out(user_to_current(user)),
        is_new=is_new,
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or user.refresh_token != refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    user.refresh_token = new_refresh
    db.commit()

    _set_cookies(response, new_access, new_refresh)

    return AuthResponse(
        access_token=new_access,
        user=_user_out(user_to_current(user)),
        is_new=False,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if user:
        user.refresh_token = None
        db.commit()

    _secure = settings.COOKIE_SECURE
    _samesite = "none" if _secure else "lax"
    response.delete_cookie(ACCESS_COOKIE, secure=_secure, samesite=_samesite)
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth/refresh", secure=_secure, samesite=_samesite)

    return {"message": "Déconnecté avec succès."}
