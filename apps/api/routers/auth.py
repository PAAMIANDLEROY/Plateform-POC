from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status

from models.user import User
from models.allowed_domain import AllowedDomain
from schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
    VerifyEmailRequest,
)
from core.config import settings
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_verification_token,
)
from core.deps import get_current_user
from services.email import send_verification_email

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
ACCESS_COOKIE = "access_token"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth/refresh",
    )


async def _is_domain_allowed(email: str) -> bool:
    domain = email.split("@")[-1].lower()
    if await AllowedDomain.find_one(AllowedDomain.domain == domain):
        return True
    return domain in settings.allowed_domains_list


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    if not await _is_domain_allowed(body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email domain not authorized. Please use your institutional email.",
        )

    if await User.find_one(User.email == body.email.lower()):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    token = generate_verification_token()
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    user = User(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        verification_token=token,
        verification_token_expires=expires,
    )
    await user.insert()

    send_verification_email(user.email, user.first_name, token)

    return {"message": "Account created. Please check your email to verify your account."}


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(body: VerifyEmailRequest):
    user = await User.find_one(User.verification_token == body.token)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    if user.verification_token_expires and user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired")

    user.is_verified = True
    user.is_active = True
    user.verification_token = None
    user.verification_token_expires = None
    await user.save()

    return {"message": "Email verified. You can now log in."}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response):
    user = await User.find_one(User.email == body.email.lower())
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    user.refresh_token = refresh_token
    await user.save()

    _set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = await User.get(payload["sub"])
    if not user or user.refresh_token != refresh_token or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    access_token = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))
    user.refresh_token = new_refresh
    await user.save()

    _set_auth_cookies(response, access_token, new_refresh)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    current_user.refresh_token = None
    await current_user.save()

    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth/refresh")

    return {"message": "Logged out successfully"}
