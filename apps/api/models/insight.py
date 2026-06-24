import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class InsightStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Insight(Base):
    """
    Article éditorial Hi! Insights.

    Les blocs de contenu (heading/text/code/quote/key-insight/figure/divider) sont
    hétérogènes → stockés en colonne JSON plutôt qu'en table dédiée. `authors` et
    `tags` sont des listes JSON-encodées (cohérent avec Course/Video).
    """
    __tablename__ = "insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500))
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    authors: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON list[str]
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON list[str]
    school: Mapped[str | None] = mapped_column(String(200), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    read_time: Mapped[int] = mapped_column(Integer, default=5)
    published_at: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "YYYY-MM-DD"
    status: Mapped[InsightStatus] = mapped_column(SAEnum(InsightStatus), default=InsightStatus.published)
    blocks: Mapped[list] = mapped_column(JSON, default=list)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author = relationship("User", foreign_keys=[created_by])
