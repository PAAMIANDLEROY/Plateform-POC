"""
Router des blocs de contenu éditables (texte des pages) — avec brouillon / publication.

  - GET  /api/v1/content         : blocs. Public → valeur PUBLIÉE ; admin → inclut le brouillon.
  - PUT  /api/v1/content/{key}   : écrit le BROUILLON (admin+), journalisé.
  - POST /api/v1/content/{key}/publish : publie le brouillon (admin+).

Flux : l'édition crée un brouillon (visible des seuls admins), la publication le rend public.
"""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.store import CurrentUser
from core.deps import require_role, get_current_user_optional
from core.roles import ADMIN_ROLES
from core.audit import log_action
from database import get_db
from models.content import ContentBlock

router = APIRouter(prefix="/api/v1/content", tags=["content"])

KEY_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,118}[a-z0-9]$")


class ContentBlockOut(BaseModel):
    key: str
    value: str                       # valeur publiée
    draft_value: Optional[str]       # brouillon (uniquement renvoyé aux admins)
    has_draft: bool
    updated_at: Optional[str]


class UpdateContentRequest(BaseModel):
    value: str


def _out(b: ContentBlock, include_draft: bool) -> ContentBlockOut:
    has_draft = b.draft_value is not None and b.draft_value != b.value
    return ContentBlockOut(
        key=b.key,
        value=b.value or "",
        draft_value=(b.draft_value if include_draft else None),
        has_draft=has_draft if include_draft else False,
        updated_at=b.updated_at.isoformat() if b.updated_at else None,
    )


@router.get("", response_model=list[ContentBlockOut])
def list_content(
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_current_user_optional),
):
    """Tous les blocs. Les admins reçoivent aussi les brouillons (pour l'aperçu)."""
    is_admin = bool(current_user and current_user.role in ADMIN_ROLES)
    return [_out(b, include_draft=is_admin) for b in db.query(ContentBlock).all()]


@router.put("/{key}", response_model=ContentBlockOut)
def upsert_draft(
    key: str,
    body: UpdateContentRequest,
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Écrit le brouillon d'un bloc (admin+). Ne publie pas."""
    if not KEY_RE.match(key):
        raise HTTPException(status_code=400, detail="Clé de bloc invalide.")

    block = db.query(ContentBlock).filter(ContentBlock.key == key).first()
    if block:
        block.draft_value = body.value
        block.updated_by = current_user.id
    else:
        # Nouveau bloc : pas encore publié → value vide, brouillon renseigné.
        block = ContentBlock(key=key, value="", draft_value=body.value, updated_by=current_user.id)
        db.add(block)

    log_action(db, current_user.id, "content_edit", "content_block", key)
    db.commit()
    db.refresh(block)
    return _out(block, include_draft=True)


@router.post("/{key}/publish", response_model=ContentBlockOut)
def publish_content(
    key: str,
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Publie le brouillon : value <- draft_value, puis efface le brouillon."""
    block = db.query(ContentBlock).filter(ContentBlock.key == key).first()
    if not block:
        raise HTTPException(status_code=404, detail="Bloc introuvable")
    if block.draft_value is not None:
        block.value = block.draft_value
        block.draft_value = None
        block.updated_by = current_user.id
        log_action(db, current_user.id, "content_publish", "content_block", key)
        db.commit()
        db.refresh(block)
    return _out(block, include_draft=True)
