"""
Router soumissions — appel à soumissions NeuriPP (projets EdTech).

  - POST /api/v1/submissions  : soumettre un projet (métadonnées + pièce jointe optionnelle < 10 Mo).
  - GET  /api/v1/submissions  : liste des soumissions (admin+), avec URL signée de la pièce jointe.

Accès : rôles de SUBMIT_ROLES (par défaut tout compte authentifié hors visiteur).
"""
import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
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

MAX_SIZE = 1 * 1024 * 1024  # 1 Mo
# Rôles autorisés à soumettre. À restreindre au besoin (ex. teacher+).
SUBMIT_ROLES = ("student", "teacher", "admin", "super_admin")

# Catégories d'usage de l'outil (cf. call for submission NeuriPP).
USAGE_CATEGORIES = {
    "tuteur_personnalise",
    "revision",
    "contenus_interactifs",
    "assistance_correction",
    "apprendre_avec_ia",
    "qcm_automatiques",
}
DOMAIN_SCOPES = {"all", "specific"}
MODEL_TYPES = {"open", "api"}

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_name(name: str) -> str:
    base = (name or "fichier").rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    cleaned = _SAFE.sub("_", base).strip("_")
    return cleaned[:200] or "fichier"


# ── Schemas ───────────────────────────────────────────────────────────────────

class SubmissionOut(BaseModel):
    id: str
    project_name: Optional[str]
    repo_url: Optional[str]
    pages_url: Optional[str]
    demo_url: Optional[str]
    license: Optional[str]
    usage_category: Optional[str]
    domain_scope: Optional[str]
    domain_detail: Optional[str]
    model_type: Optional[str]
    authors: Optional[str]
    description: Optional[str]
    rules_consent: bool
    filename: Optional[str]
    size: int
    uploaded_by: str
    created_at: Optional[str]
    file_url: Optional[str] = None


def _out(s: Submission, file_url: Optional[str] = None) -> SubmissionOut:
    return SubmissionOut(
        id=s.id,
        project_name=s.project_name,
        repo_url=s.repo_url,
        pages_url=s.pages_url,
        demo_url=s.demo_url,
        license=s.license,
        usage_category=s.usage_category,
        domain_scope=s.domain_scope,
        domain_detail=s.domain_detail,
        model_type=s.model_type,
        authors=s.authors,
        description=s.description,
        rules_consent=bool(s.rules_consent),
        filename=s.filename,
        size=s.size or 0,
        uploaded_by=s.uploaded_by,
        created_at=s.created_at.isoformat() if s.created_at else None,
        file_url=file_url,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    project_name: str = Form(...),
    repo_url: str = Form(...),
    usage_category: str = Form(...),
    rules_consent: bool = Form(...),
    pages_url: Optional[str] = Form(None),
    demo_url: Optional[str] = Form(None),
    license: Optional[str] = Form(None),
    domain_scope: str = Form("all"),
    domain_detail: Optional[str] = Form(None),
    model_type: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(require_role(*SUBMIT_ROLES)),
    db: Session = Depends(get_db),
):
    # ── Validation ────────────────────────────────────────────────────────────
    if not project_name.strip():
        raise HTTPException(status_code=400, detail="Nom du projet requis.")
    if not repo_url.strip():
        raise HTTPException(status_code=400, detail="Lien du repo requis.")
    if usage_category not in USAGE_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Catégorie d'usage invalide : {usage_category}")
    if domain_scope not in DOMAIN_SCOPES:
        raise HTTPException(status_code=400, detail="Périmètre invalide (all | specific).")
    if model_type is not None and model_type not in MODEL_TYPES:
        raise HTTPException(status_code=400, detail="Type de modèle invalide (open | api).")
    if not rules_consent:
        raise HTTPException(
            status_code=400,
            detail="Vous devez confirmer le respect des règles (consentement de l'enseignant).",
        )

    # ── Pièce jointe optionnelle ──────────────────────────────────────────────
    filename = content_type = storage_path = None
    size = 0
    if file is not None and file.filename:
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=413, detail="Pièce jointe trop volumineuse (max 1 Mo).")
        if len(content) > 0:
            filename = _safe_name(file.filename)
            content_type = file.content_type
            size = len(content)
            storage_path = f"{current_user.id}/{uuid.uuid4().hex}_{filename}"
            try:
                storage.upload_file(content, storage_path, content_type)
            except RuntimeError as e:
                raise HTTPException(status_code=503, detail=f"Stockage indisponible : {e}")

    submission = Submission(
        id=str(uuid.uuid4()),
        project_name=project_name.strip(),
        repo_url=repo_url.strip(),
        pages_url=(pages_url or "").strip() or None,
        demo_url=(demo_url or "").strip() or None,
        license=(license or "").strip() or None,
        usage_category=usage_category,
        domain_scope=domain_scope,
        domain_detail=(domain_detail or "").strip() or None,
        model_type=model_type,
        authors=(authors or "").strip() or None,
        description=(description or "").strip() or None,
        rules_consent=rules_consent,
        filename=filename,
        content_type=content_type,
        size=size,
        storage_path=storage_path,
        uploaded_by=current_user.id,
    )
    db.add(submission)
    log_action(db, current_user.id, "submission_create", "submission", submission.id,
               {"project_name": submission.project_name, "usage_category": usage_category})
    db.commit()
    db.refresh(submission)
    return _out(submission)


@router.get("", response_model=list[SubmissionOut])
def list_submissions(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    rows = db.query(Submission).order_by(Submission.created_at.desc()).all()
    return [
        _out(s, file_url=storage.create_signed_url(s.storage_path) if s.storage_path else None)
        for s in rows
    ]
