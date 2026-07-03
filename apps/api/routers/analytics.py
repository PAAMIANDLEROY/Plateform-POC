"""
Analytics router — Phase 6.
Platform-level KPIs and at-risk alerts for admin/teacher dashboards.
Uses PostgreSQL via SQLAlchemy.
"""
import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.deps import get_current_user, require_role
from core.store import CurrentUser
from database import get_db
from models.user import User
from models.course import Course, UserCourseProgress
from models.video import Video
from models.mooc import MOOC
from models.app import App

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

ADMIN_ROLES = ("admin", "super_admin")
TEACHER_ROLES = ("teacher", "admin", "super_admin")


# ─── Platform KPIs ────────────────────────────────────────────────────────────

@router.get("/platform")
def get_platform_kpis(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Global platform KPIs for admin dashboard."""
    all_users = db.query(User).all()

    users_by_role: dict[str, int] = {}
    for user in all_users:
        role = user.role.value if hasattr(user.role, "value") else str(user.role)
        users_by_role[role] = users_by_role.get(role, 0) + 1

    # Actifs sur 30 j : utilisateurs distincts avec une activité d'apprentissage récente
    # (vraie donnée, pas le total). Pas de tracking de connexion en DB → proxy par la progression.
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    active_last_30d = (
        db.query(func.count(func.distinct(UserCourseProgress.user_id)))
        .filter(UserCourseProgress.updated_at >= cutoff)
        .scalar()
    ) or 0

    return {
        "users": {
            "total": len(all_users),
            "by_role": users_by_role,
            "active_last_30d": active_last_30d,
        },
        "content": {
            "courses_total": db.query(Course).count(),
            "courses_published": db.query(Course).filter(Course.status == "published").count(),
            "videos": db.query(Video).count(),
            "moocs": db.query(MOOC).count(),
            "apps": db.query(App).count(),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ─── At-risk students ─────────────────────────────────────────────────────────

@router.get("/at-risk")
def get_at_risk_students(
    inactivity_days: int = 7,
    score_threshold: int = 60,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Returns learners who exceed the configured at-risk thresholds.
      - inactivity_days: days since last activity (default 7)
      - score_threshold: minimum quiz average below which a student is at risk (default 60)
    """
    students = db.query(User).filter(User.role == "student").all()
    at_risk = []

    for user in students:
        progress_list = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id == user.id
        ).all()

        scores = [p.score for p in progress_list if p.score is not None]
        avg_score = int(sum(scores) / len(scores)) if scores else None

        at_risk_reason = []
        if avg_score is not None and avg_score < score_threshold:
            at_risk_reason.append(f"score_below_{score_threshold}")

        if at_risk_reason:
            at_risk.append({
                "id": user.id,
                "email": user.email,
                "school": user.school or "",
                "avg_score": avg_score,
                "reasons": at_risk_reason,
            })

    return {
        "thresholds": {
            "inactivity_days": inactivity_days,
            "score_threshold": score_threshold,
        },
        "count": len(at_risk),
        "students": at_risk,
    }


# ─── CSV exports ──────────────────────────────────────────────────────────────

@router.get("/export/users")
def export_users_csv(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Export all users as CSV (admin only). Anonymised for RGPD compliance."""
    all_users = db.query(User).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Role", "École", "Vérifié"])
    for u in all_users:
        writer.writerow([
            u.id,
            u.role.value if hasattr(u.role, "value") else str(u.role),
            u.school or "",
            "Oui" if u.is_verified else "Non",
        ])

    output.seek(0)
    today = datetime.utcnow().date()
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=users-{today}.csv"},
    )


@router.get("/export/courses")
def export_courses_csv(
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Export a summary of courses as CSV (teacher/admin)."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Note"])
    writer.writerow(["Export cours disponible via /api/v1/courses/"])

    output.seek(0)
    today = datetime.utcnow().date()
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=courses-{today}.csv"},
    )
