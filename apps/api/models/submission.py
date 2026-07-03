"""
Soumission de projet EdTech — appel à soumissions NeuriPP.

Capture le format de soumission : repo GitHub, page projet, licence, démo,
catégorie d'usage, périmètre (matière/tous domaines), type de modèle (open/API),
consentement aux règles, auteurs. Un fichier joint (poster/slides) est optionnel
et vit dans Supabase Storage.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # ── Projet ────────────────────────────────────────────────────────────────
    project_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    repo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pages_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)   # github.io / page projet
    demo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    license: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    usage_category: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    domain_scope: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)   # all | specific
    domain_detail: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    model_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)     # open | api
    authors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rules_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Pièce jointe optionnelle (Supabase Storage) ────────────────────────────
    filename: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)
    content_type: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_path: Mapped[Optional[str]] = mapped_column(String(600), nullable=True)

    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
