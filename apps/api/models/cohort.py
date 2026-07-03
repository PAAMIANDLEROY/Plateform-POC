"""
Modèles cohortes (Lot 3 — voir ROLES-ET-DROITS.md §5).

  - Cohort         : une cohorte appartenant à un enseignant (owner).
  - CohortMember   : appartenance d'un élève à une cohorte.
  - CohortCourse   : cours du catalogue auxquels la cohorte donne accès
                     (levier « donner accès à des cours » du prof).
"""
import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Text, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from database import Base


class CohortStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    archived = "archived"


class MemberStatus(str, enum.Enum):
    active = "active"
    at_risk = "at_risk"
    completed = "completed"
    inactive = "inactive"


class Cohort(Base):
    __tablename__ = "cohorts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    school: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    status: Mapped[CohortStatus] = mapped_column(SAEnum(CohortStatus), default=CohortStatus.draft)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("CohortMember", back_populates="cohort", cascade="all, delete-orphan")
    courses = relationship("CohortCourse", back_populates="cohort", cascade="all, delete-orphan")


class CohortMember(Base):
    __tablename__ = "cohort_members"
    __table_args__ = (
        UniqueConstraint("cohort_id", "user_id", name="uq_cohort_member"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cohort_id: Mapped[str] = mapped_column(String(36), ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[MemberStatus] = mapped_column(SAEnum(MemberStatus), default=MemberStatus.active)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cohort = relationship("Cohort", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])


class CohortCourse(Base):
    __tablename__ = "cohort_courses"
    __table_args__ = (
        UniqueConstraint("cohort_id", "course_id", name="uq_cohort_course"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cohort_id: Mapped[str] = mapped_column(String(36), ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    granted_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cohort = relationship("Cohort", back_populates="courses")
