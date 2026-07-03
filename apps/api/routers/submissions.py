"""
Router soumissions de fichiers (onglet « About us »).

  - POST /api/v1/submissions  : upload d'un fichier (< 10 Mo) → Supabase Storage + métadonnées DB.
  - GET  /api/v1/submissions  : liste des soumissions (admin+), avec URL signée temporaire.

Accès à l'upload : rôles de SUBMIT_ROLES (par défaut tout compte authentifié hors visiteur).
"""
import re
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

import services.storage as storage
from core.store import CurrentUser
from core.deps import require_role
from core.roles import ADMIN_ROLES
from core.audit import log_action
from database import get_db
from models.submission import Submission

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])

MAX_SIZE = 10 * 1024 * 1024  # 10 Mo
# Rôles autorisés à soumettre. À restreindre au besoin (ex. teacher+).
SUBMIT_ROLES = ("student", "teacher", "admin", "super_admin")

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_name(name: str) -> str:
    base = (name or "fichier").rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    cleaned = _SAFE.sub("_", base).strip("_")
    return cleaned[:200] or "fichier"


# ── Schemas ───────────────────────────────────────────────────────────────────

class SubmissionOut(BaseModel):
    id: str
    filename: str
    content_type: Optional[str]
    size: int
    uploaded_by: str
    created_at: Optional[str]
    url: Optional[str] = None


def _out(s: Submission, url: Optional[str] = None) -> SubmissionOut:
    return SubmissionOut(
        id=s.id, filename=s.filename, content_type=s.content_type, size=s.size,
        uploaded_by=s.uploaded_by,
        created_at=s.created_at.isoformat() if s.created_at else None,
        url=url,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role(*SUBMIT_ROLES)),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide.")
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 Mo).")

    safe = _safe_name(file.filename or "fichier")
    path = f"{current_user.id}/{uuid.uuid4().hex}_{safe}"

    try:
        storage.upload_file(content, path, file.content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"Stockage indisponible : {e}")

    submission = Submission(
        id=str(uuid.uuid4()),
        filename=safe,
        content_type=file.content_type,
        size=len(content),
        storage_path=path,
        uploaded_by=current_user.id,
    )
    db.add(submission)
    log_action(db, current_user.id, "submission_create", "submission", submission.id,
               {"filename": safe, "size": len(content)})
    db.commit()
    db.refresh(submission)
    return _out(submission)


@router.get("", response_model=list[SubmissionOut])
def list_submissions(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    rows = db.query(Submission).order_by(Submission.created_at.desc()).all()
    return [_out(s, url=storage.create_signed_url(s.storage_path)) for s in rows]
