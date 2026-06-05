import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from database import Base


class MOOCStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class MOOC(Base):
    __tablename__ = "moocs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    school: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[MOOCStatus] = mapped_column(SAEnum(MOOCStatus), default=MOOCStatus.draft)
    is_linear: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", foreign_keys=[created_by])
    modules = relationship("MOOCModule", back_populates="mooc", cascade="all, delete-orphan", order_by="MOOCModule.position")
    enrollments = relationship("UserMOOCEnrollment", back_populates="mooc", cascade="all, delete-orphan")


class MOOCModule(Base):
    __tablename__ = "mooc_modules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mooc_id: Mapped[str] = mapped_column(String(36), ForeignKey("moocs.id"))
    title: Mapped[str] = mapped_column(String(300))
    position: Mapped[int] = mapped_column(Integer)

    # Phase 5.2 — Conditional unlock (prerequisites)
    min_score_to_unlock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prerequisite_module_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("mooc_modules.id"), nullable=True)

    mooc = relationship("MOOC", back_populates="modules")
    courses = relationship("MOOCModuleCourse", back_populates="module", cascade="all, delete-orphan", order_by="MOOCModuleCourse.position")
    prerequisite = relationship("MOOCModule", remote_side="MOOCModule.id", foreign_keys=[prerequisite_module_id])


class MOOCModuleCourse(Base):
    __tablename__ = "mooc_module_courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("mooc_modules.id"))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id"))
    position: Mapped[int] = mapped_column(Integer)

    module = relationship("MOOCModule", back_populates="courses")
    course = relationship("Course")


class UserMOOCEnrollment(Base):
    __tablename__ = "user_mooc_enrollments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    mooc_id: Mapped[str] = mapped_column(String(36), ForeignKey("moocs.id"))
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    mooc = relationship("MOOC", back_populates="enrollments")
