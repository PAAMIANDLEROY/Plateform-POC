import enum
from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"
    superuser = "superuser"
    public = "public"


class User(Document):
    first_name: str
    last_name: str
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    role: UserRole = UserRole.student
    is_active: bool = False
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    refresh_token: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "users"
