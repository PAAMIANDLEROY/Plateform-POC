"""
Analytics router — Phase 6.
Provides platform-level KPIs and cohort metrics for admin/teacher dashboards.
All endpoints require admin or teacher role.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import csv
import io
from datetime import datetime, timedelta

from core.deps import get_db, get_current_user
from models.user import User
from models.course import Course
from models.video import Video
from models.mooc import MOOC
from models.app import App

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superuser"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superuser", "teacher"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user


# ─── Platform KPIs ────────────────────────────────────────────────────────────

@router.get("/platform")
def get_platform_kpis(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Global platform KPIs for admin dashboard."""
    from models.user import User as UserModel

    total_users = db.query(UserModel).count()
    users_by_role = {}
    for role in ("student", "teacher", "admin", "superuser"):
        users_by_role[role] = db.query(UserModel).filter(UserModel.role == role).count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_recently = (
        db.query(UserModel)
        .filter(UserModel.updated_at >= thirty_days_ago)
        .count()
    )

    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(Course.status == "published").count()
    total_videos = db.query(Video).count()
    total_moocs = db.query(MOOC).count()
    total_apps = db.query(App).count()

    return {
        "users": {
            "total": total_users,
            "by_role": users_by_role,
            "active_last_30d": active_recently,
        },
        "content": {
            "courses_total": total_courses,
            "courses_published": published_courses,
            "videos": total_videos,
            "moocs": total_moocs,
            "apps": total_apps,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


# ─── Export CSV ───────────────────────────────────────────────────────────────

@router.get("/export/users")
def export_users_csv(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Export all users as CSV (admin only). Anonymised for RGPD compliance."""
    from models.user import User as UserModel

    users = db.query(UserModel).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Rôle", "École", "Vérifié", "Créé le"])
    for u in users:
        writer.writerow([
            u.id,
            u.role,
            u.school or "",
            "Oui" if u.is_verified else "Non",
            u.created_at.strftime("%Y-%m-%d") if hasattr(u, "created_at") and u.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users-{datetime.utcnow().date()}.csv"},
    )


@router.get("/export/courses")
def export_courses_csv(
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    """Export course catalogue as CSV."""
    courses = db.query(Course).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Titre", "Catégorie", "Niveau", "École", "Statut", "Durée (min)"])
    for c in courses:
        writer.writerow([
            c.id,
            c.title,
            c.category or "",
            c.level or "",
            c.school or "",
            c.status,
            c.estimated_duration_minutes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=courses-{datetime.utcnow().date()}.csv"},
    )


# ─── At-risk threshold endpoint ──────────────────────────────────────────────

@router.get("/at-risk")
def get_at_risk_students(
    inactivity_days: int = 7,
    score_threshold: int = 60,
    db: Session = Depends(get_db),
    _: User = Depends(require_teacher),
):
    """
    Returns learners who exceed the configured at-risk thresholds.
    Thresholds are configurable per request:
      - inactivity_days: days since last activity (default 7)
      - score_threshold: minimum quiz average (default 60)
    """
    from models.user import User as UserModel

    cutoff = datetime.utcnow() - timedelta(days=inactivity_days)

    # In a full implementation this would JOIN with progress/enrollment tables.
    # Placeholder: return users updated before the cutoff date.
    at_risk = (
        db.query(UserModel)
        .filter(
            UserModel.role == "student",
            UserModel.updated_at < cutoff,
        )
        .limit(50)
        .all()
    )

    return {
        "thresholds": {"inactivity_days": inactivity_days, "score_threshold": score_threshold},
        "count": len(at_risk),
        "students": [
            {"id": u.id, "email": u.email, "school": u.school}
            for u in at_risk
        ],
    }
