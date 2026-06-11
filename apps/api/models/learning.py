"""
Learning-related SQLAlchemy models that are NOT covered by course.py / mooc.py:
  - Otp
  - UserBadge
  - UserCertificate

UserCourseProgress lives in models/course.py (maintains Course relationship).
UserMOOCEnrollment lives in models/mooc.py (maintains MOOC relationship).
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Otp(Base):
    __tablename__ = "otps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id: Mapped[str] = mapped_column(String(50), nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class UserCertificate(Base):
    __tablename__ = "user_certificates"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_certificate_course"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(String(36), nullable=False)
    course_title: Mapped[str] = mapped_column(String(500), nullable=False)
    user_name: Mapped[str] = mapped_column(String(300), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    verification_token: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
