"""
Parcours apprenant — progression, badges, certificats.
"""
import uuid
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.deps import get_current_user
from core.store import CurrentUser, BADGE_CATALOG
from database import get_db
from models.course import UserCourseProgress
from models.mooc import UserMOOCEnrollment
from models.learning import UserBadge, UserCertificate
from services.certificate import generate_certificate_pdf
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/learning", tags=["learning"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    progress_pct: int       # 0-100
    score: Optional[int] = None


# ── Internal helpers ──────────────────────────────────────────────────────────

def _progress_to_dict(p: UserCourseProgress) -> dict:
    return {
        "course_id": p.course_id,
        "progress_pct": p.progress_pct,
        "score": p.score,
        "completed": p.completed_at is not None,
        "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        "started_at": p.started_at.isoformat() if p.started_at else None,
        "last_activity": p.updated_at.isoformat() if p.updated_at else None,
    }


def _cert_to_dict(cert: UserCertificate) -> dict:
    return {
        "id": cert.id,
        "user_id": cert.user_id,
        "course_id": cert.course_id,
        "course_title": cert.course_title,
        "user_name": cert.user_name,
        "issued_at": cert.issued_at.isoformat(),
        "verification_url": f"/api/v1/learning/certificates/{cert.id}/verify",
        "verification_token": cert.verification_token,
    }


def _enrollment_to_dict(e: UserMOOCEnrollment) -> dict:
    return {
        "user_id": e.user_id,
        "mooc_id": e.mooc_id,
        "enrolled": True,
        "enrolled_at": e.enrolled_at.isoformat(),
        "completed_modules": e.completed_modules or [],
        "completed_at": e.completed_at.isoformat() if e.completed_at else None,
    }


def _award_badge_if_needed(db: Session, user_id: str, badge_id: str, current_value: int) -> None:
    """Award a badge if threshold met and not already awarded. Caller must commit."""
    badge_def = next((b for b in BADGE_CATALOG if b["id"] == badge_id), None)
    if not badge_def or current_value < badge_def["threshold"]:
        return
    already_earned = db.query(UserBadge).filter(
        UserBadge.user_id == user_id,
        UserBadge.badge_id == badge_id,
    ).first()
    if not already_earned:
        db.add(UserBadge(id=str(uuid.uuid4()), user_id=user_id, badge_id=badge_id))
        db.flush()


def _get_earned_badges(db: Session, user_id: str) -> list[dict]:
    rows = db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    result = []
    for row in rows:
        badge_def = next((b for b in BADGE_CATALOG if b["id"] == row.badge_id), None)
        if badge_def:
            result.append({**badge_def, "awarded_at": row.awarded_at.isoformat()})
    return result


def _count_completed(db: Session, user_id: str) -> int:
    return db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == user_id,
        UserCourseProgress.completed_at.isnot(None),
    ).count()


# ── Progress ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tableau de bord complet de l'apprenant."""
    all_progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id
    ).all()
    progress_dicts = [_progress_to_dict(p) for p in all_progress]
    completed = [p for p in progress_dicts if p["completed"]]
    in_progress = [p for p in progress_dicts if not p["completed"] and p["progress_pct"] > 0]

    badges = _get_earned_badges(db, current_user.id)

    cert_rows = db.query(UserCertificate).filter(
        UserCertificate.user_id == current_user.id
    ).all()
    cert_list = [_cert_to_dict(c) for c in cert_rows]

    return {
        "total_courses_started": len(all_progress),
        "total_courses_completed": len(completed),
        "total_badges": len(badges),
        "total_certificates": len(cert_list),
        "progress": progress_dicts,
        "badges": badges,
        "certificates": cert_list,
        "in_progress": in_progress,
        "completed": completed,
    }


@router.get("/progress")
def get_all_progress(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id
    ).all()
    return [_progress_to_dict(p) for p in rows]


@router.get("/progress/{course_id}")
def get_course_progress(
    course_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id,
    ).first()
    return _progress_to_dict(p) if p else {"course_id": course_id, "progress_pct": 0, "completed": False}


@router.post("/progress/{course_id}")
def update_progress(
    course_id: str,
    body: ProgressUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    pct = max(0, min(100, body.progress_pct))

    p = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id,
    ).first()

    if not p:
        p = UserCourseProgress(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            course_id=course_id,
            progress_pct=0,
            started_at=now,
            updated_at=now,
        )
        db.add(p)

    # Progress never goes backward
    p.progress_pct = max(p.progress_pct, pct)
    p.updated_at = now
    if not p.started_at:
        p.started_at = now

    if body.score is not None:
        p.score = body.score
        if body.score == 100:
            _award_badge_if_needed(db, current_user.id, "perfectionist", 1)

    if pct >= 100 and p.completed_at is None:
        p.completed_at = now
        db.flush()
        completed = _count_completed(db, current_user.id)
        _award_badge_if_needed(db, current_user.id, "first_step", completed)
        _award_badge_if_needed(db, current_user.id, "on_fire", completed)
        _award_badge_if_needed(db, current_user.id, "bookworm", completed)
        _award_badge_if_needed(db, current_user.id, "expert", completed)

    db.commit()

    new_badges = _get_earned_badges(db, current_user.id)
    return {**_progress_to_dict(p), "badges": new_badges}


@router.post("/complete/{course_id}")
def complete_course(
    course_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marque un cours comme complété à 100%."""
    now = datetime.now(timezone.utc)

    p = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id,
    ).first()

    if not p:
        p = UserCourseProgress(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            course_id=course_id,
            progress_pct=100,
            started_at=now,
            completed_at=now,
            updated_at=now,
        )
        db.add(p)
    elif p.completed_at is None:
        p.progress_pct = 100
        p.updated_at = now
        p.completed_at = now

    db.flush()
    completed = _count_completed(db, current_user.id)
    _award_badge_if_needed(db, current_user.id, "first_step", completed)
    _award_badge_if_needed(db, current_user.id, "on_fire", completed)
    _award_badge_if_needed(db, current_user.id, "bookworm", completed)
    _award_badge_if_needed(db, current_user.id, "expert", completed)
    db.commit()

    badges = _get_earned_badges(db, current_user.id)
    return {"message": "Cours complété !", "progress": _progress_to_dict(p), "badges": badges}


# ── Badges ────────────────────────────────────────────────────────────────────

@router.get("/badges")
def get_badges(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    earned = _get_earned_badges(db, current_user.id)
    earned_ids = {b["id"] for b in earned}
    locked = [b for b in BADGE_CATALOG if b["id"] not in earned_ids]
    return {"earned": earned, "locked": locked, "total": len(BADGE_CATALOG)}


# ── Certificats ───────────────────────────────────────────────────────────────

@router.post("/certificates/{course_id}")
def issue_certificate(
    course_id: str,
    course_title: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Émet un certificat pour un cours complété."""
    progress = db.query(UserCourseProgress).filter(
        UserCourseProgress.user_id == current_user.id,
        UserCourseProgress.course_id == course_id,
        UserCourseProgress.completed_at.isnot(None),
    ).first()

    if not progress:
        raise HTTPException(status_code=400, detail="Le cours n'est pas encore complété")

    # Idempotent: return existing certificate if any
    existing = db.query(UserCertificate).filter(
        UserCertificate.user_id == current_user.id,
        UserCertificate.course_id == course_id,
    ).first()
    if existing:
        return _cert_to_dict(existing)

    user_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.email
    cert = UserCertificate(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        course_id=course_id,
        course_title=course_title,
        user_name=user_name,
        verification_token=secrets.token_urlsafe(16),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return _cert_to_dict(cert)


@router.get("/certificates")
def list_certificates(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    certs = db.query(UserCertificate).filter(
        UserCertificate.user_id == current_user.id
    ).all()
    return [_cert_to_dict(c) for c in certs]


@router.get("/certificates/{cert_id}/verify")
def verify_certificate(cert_id: str, db: Session = Depends(get_db)):
    """Endpoint public de vérification d'un certificat."""
    cert = db.query(UserCertificate).filter(UserCertificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable ou invalide")
    return {
        "valid": True,
        "user_name": cert.user_name,
        "course_title": cert.course_title,
        "issued_at": cert.issued_at.isoformat(),
        "certificate_id": cert_id,
    }


@router.get("/certificates/{cert_id}/download")
def download_certificate(
    cert_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Télécharge le certificat en PDF."""
    cert = db.query(UserCertificate).filter(UserCertificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")
    if cert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    pdf_bytes = generate_certificate_pdf(
        user_name=cert.user_name,
        course_title=cert.course_title,
        issued_at=cert.issued_at.isoformat(),
        verification_url=f"/api/v1/learning/certificates/{cert_id}/verify",
        frontend_url=settings.FRONTEND_URL,
    )
    filename = f"certificat-hiplatform-{cert_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── MOOC ──────────────────────────────────────────────────────────────────────

@router.post("/mooc/{mooc_id}/enroll")
def enroll_mooc(
    mooc_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()

    if not enrollment:
        enrollment = UserMOOCEnrollment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            mooc_id=mooc_id,
            completed_modules=[],
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

    return _enrollment_to_dict(enrollment)


class ModuleUnlockCheck(BaseModel):
    module_id: str
    prerequisite_module_id: str | None = None
    min_score_to_unlock: int | None = None


@router.post("/mooc/{mooc_id}/module/{module_id}/check-unlock")
def check_module_unlock(
    mooc_id: str,
    module_id: str,
    body: ModuleUnlockCheck,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 5.2 — Vérifie si un module est déverrouillé pour l'utilisateur.
    """
    enrollment = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()

    completed_modules = (enrollment.completed_modules or []) if enrollment else []

    if not body.prerequisite_module_id:
        return {"unlocked": True, "reason": "no_prerequisite"}

    if body.prerequisite_module_id not in completed_modules:
        return {
            "unlocked": False,
            "reason": "prerequisite_not_completed",
            "required_module_id": body.prerequisite_module_id,
        }

    if body.min_score_to_unlock is not None:
        all_progress = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == current_user.id,
        ).all()
        scores = [p.score for p in all_progress if p.score is not None]
        avg_score = int(sum(scores) / len(scores)) if scores else 0

        if avg_score < body.min_score_to_unlock:
            return {
                "unlocked": False,
                "reason": "score_too_low",
                "your_score": avg_score,
                "required_score": body.min_score_to_unlock,
            }

    return {"unlocked": True, "reason": "prerequisites_met"}


@router.post("/mooc/{mooc_id}/module/{module_id}/complete")
def complete_module(
    mooc_id: str,
    module_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()

    if not enrollment:
        enrollment = UserMOOCEnrollment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            mooc_id=mooc_id,
            completed_modules=[module_id],
        )
        db.add(enrollment)
    else:
        modules = list(enrollment.completed_modules or [])
        if module_id not in modules:
            modules.append(module_id)
        enrollment.completed_modules = modules  # Reassign to trigger change detection

    db.flush()

    completed_modules = enrollment.completed_modules or []
    # Award MOOC graduate badge if 3+ modules completed
    if len(completed_modules) >= 3:
        _award_badge_if_needed(db, current_user.id, "graduate", 1)

    db.commit()
    db.refresh(enrollment)
    return _enrollment_to_dict(enrollment)


@router.get("/mooc/{mooc_id}")
def get_mooc_progress(
    mooc_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = db.query(UserMOOCEnrollment).filter(
        UserMOOCEnrollment.user_id == current_user.id,
        UserMOOCEnrollment.mooc_id == mooc_id,
    ).first()
    return _enrollment_to_dict(enrollment) if enrollment else {"mooc_id": mooc_id, "enrolled": False}
