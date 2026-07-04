"""
Blocs de contenu éditables (texte des pages).

Surcharge, par clé, le texte écrit en dur dans les pages : si un bloc existe en base,
le front l'affiche à la place du fallback codé. Édition réservée admin/super_admin.
Aucune modification de structure — uniquement du texte.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ContentBlock(Base):
    __tablename__ = "content_blocks"

    # Clé stable (ex. "neuripp.intro", "home.hero"). Choisie par le développeur dans le code.
    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")           # publié
    draft_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)        # brouillon en attente (None = aucun)
    updated_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
