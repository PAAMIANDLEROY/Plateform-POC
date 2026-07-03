import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from database import Base


class CourseLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CourseStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class CourseAccessLevel(str, enum.Enum):
    """Niveau d'accès (voir ROLES-ET-DROITS.md §4)."""
    public = "public"      # base « simple » — tout le monde
    hiparis = "hiparis"    # base « Hi! PARIS » — élèves (domaine autorisé) et +
    cohort = "cohort"      # réservé aux membres d'une cohorte y ayant accès


class BlockType(str, enum.Enum):
    heading = "heading"
    text = "text"
    markdown = "markdown"
    image = "image"
    quiz = "quiz"
    video = "video"
    divider = "divider"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON-encoded
    level: Mapped[CourseLevel] = mapped_column(SAEnum(CourseLevel), default=CourseLevel.beginner)
    school: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[CourseStatus] = mapped_column(SAEnum(CourseStatus), default=CourseStatus.draft)
    access_level: Mapped[CourseAccessLevel] = mapped_column(
        SAEnum(CourseAccessLevel), default=CourseAccessLevel.public, server_default="public"
    )
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author = relationship("User", foreign_keys=[created_by])
    blocks = relationship("CourseBlock", back_populates="course", cascade="all, delete-orphan", order_by="CourseBlock.position")
    enrollments = relationship("UserCourseProgress", back_populates="course", cascade="all, delete-orphan")


class CourseBlock(Base):
    __tablename__ = "course_blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id"))
    position: Mapped[int] = mapped_column(Integer)
    type: Mapped[BlockType] = mapped_column(SAEnum(BlockType))
    content: Mapped[dict] = mapped_column(JSON)

    course = relationship("Course", back_populates="blocks")


class UserCourseProgress(Base):
    """
    Tracks a user's progress on a course.
    Extended in migration 0005 to add progress_pct, score, started_at.
    """
    __tablename__ = "user_course_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_progress_user_course"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    course_id: Mapped[str] = mapped_column(String(36), ForeignKey("courses.id"))
    # Added in migration 0005
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Original columns
    completed_blocks: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", foreign_keys=[user_id])
    course = relationship("Course", back_populates="enrollments")
