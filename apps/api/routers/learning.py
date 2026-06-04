"""
Parcours apprenant — progression, badges, certificats.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from core.deps import get_current_user
from core.store import store, CurrentUser, BADGE_CATALOG
from services.certificate import generate_certificate_pdf
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/learning", tags=["learning"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    progress_pct: int       # 0-100
    score: Optional[int] = None  # score quiz (0-100)


# ── Progress ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(current_user: CurrentUser = Depends(get_current_user)):
    """Tableau de bord complet de l'apprenant."""
    return store.get_learning_dashboard(current_user.id)


@router.get("/progress")
def get_all_progress(current_user: CurrentUser = Depends(get_current_user)):
    return store.get_all_progress(current_user.id)


@router.get("/progress/{course_id}")
def get_course_progress(course_id: str, current_user: CurrentUser = Depends(get_current_user)):
    p = store.get_course_progress(current_user.id, course_id)
    return p or {"course_id": course_id, "progress_pct": 0, "completed": False}


@router.post("/progress/{course_id}")
def update_progress(
    course_id: str,
    body: ProgressUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    pct = max(0, min(100, body.progress_pct))
    result = store.update_course_progress(current_user.id, course_id, pct, body.score)

    # New badges earned?
    new_badges = store.get_badges(current_user.id)
    return {**result, "badges": new_badges}


@router.post("/complete/{course_id}")
def complete_course(course_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Marque un cours comme complété à 100%."""
    result = store.update_course_progress(current_user.id, course_id, 100)
    badges = store.get_badges(current_user.id)
    return {"message": "Cours complété !", "progress": result, "badges": badges}


# ── Badges ────────────────────────────────────────────────────────────────────

@router.get("/badges")
def get_badges(current_user: CurrentUser = Depends(get_current_user)):
    earned = store.get_badges(current_user.id)
    earned_ids = {b["id"] for b in earned}
    locked = [b for b in BADGE_CATALOG if b["id"] not in earned_ids]
    return {"earned": earned, "locked": locked, "total": len(BADGE_CATALOG)}


# ── Certificats ───────────────────────────────────────────────────────────────

@router.post("/certificates/{course_id}")
def issue_certificate(
    course_id: str,
    course_title: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Émet un certificat pour un cours complété."""
    user_data = store.get_by_id(current_user.id)
    user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email

    try:
        cert = store.issue_certificate(current_user.id, course_id, course_title, user_name)
        return cert
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/certificates")
def list_certificates(current_user: CurrentUser = Depends(get_current_user)):
    return store.get_certificates(current_user.id)


@router.get("/certificates/{cert_id}/verify")
def verify_certificate(cert_id: str):
    """Endpoint public de vérification d'un certificat."""
    cert = store.get_certificate(cert_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable ou invalide")
    return {
        "valid": True,
        "user_name": cert["user_name"],
        "course_title": cert["course_title"],
        "issued_at": cert["issued_at"],
        "certificate_id": cert_id,
    }


@router.get("/certificates/{cert_id}/download")
def download_certificate(cert_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Télécharge le certificat en PDF."""
    cert = store.get_certificate(cert_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")
    if cert["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    pdf_bytes = generate_certificate_pdf(
        user_name=cert["user_name"],
        course_title=cert["course_title"],
        issued_at=cert["issued_at"],
        verification_url=cert["verification_url"],
        frontend_url=settings.FRONTEND_URL,
    )

    filename = f"certificat-hiplatform-{cert_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── MOOC ─────────────────────────────────────────────────────────────────────

@router.post("/mooc/{mooc_id}/enroll")
def enroll_mooc(mooc_id: str, current_user: CurrentUser = Depends(get_current_user)):
    return store.enroll_mooc(current_user.id, mooc_id)


@router.post("/mooc/{mooc_id}/module/{module_id}/complete")
def complete_module(mooc_id: str, module_id: str, current_user: CurrentUser = Depends(get_current_user)):
    result = store.complete_mooc_module(current_user.id, mooc_id, module_id)
    # Award MOOC badge if all 3 modules done
    if len(result.get("completed_modules", [])) >= 3:
        store._award_badge_if_needed(current_user.id, "graduate", 1)
    return result


@router.get("/mooc/{mooc_id}")
def get_mooc_progress(mooc_id: str, current_user: CurrentUser = Depends(get_current_user)):
    return store.get_mooc_progress(current_user.id, mooc_id) or {"mooc_id": mooc_id, "enrolled": False}
