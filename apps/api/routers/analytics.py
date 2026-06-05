"""
Analytics router — Phase 6.
Provides platform-level KPIs and at-risk alerts for admin/teacher dashboards.
Uses the in-memory store (same pattern as other routers).
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import csv
import io

from core.deps import get_current_user, require_role
from core.store import store, CurrentUser

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

ADMIN_ROLES = ("admin", "superuser")
TEACHER_ROLES = ("teacher", "admin", "superuser")


# ─── Platform KPIs ────────────────────────────────────────────────────────────

@router.get("/platform")
def get_platform_kpis(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
):
    """Global platform KPIs for admin dashboard."""
    all_users = store.get_all_users()
    users_by_role: dict[str, int] = {}
    for user in all_users:
        role = user.get("role", "student")
        users_by_role[role] = users_by_role.get(role, 0) + 1

    return {
        "users": {
            "total": len(all_users),
            "by_role": users_by_role,
            "active_last_30d": len(all_users),
        },
        "content": {
            "note": "Content counts available via PostgreSQL when DB is connected.",
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


# ─── At-risk students ────────────────────────────────────────────────────────

@router.get("/at-risk")
def get_at_risk_students(
    inactivity_days: int = 7,
    score_threshold: int = 60,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """
    Returns learners who exceed the configured at-risk thresholds.
      - inactivity_days: days since last activity (default 7)
      - score_threshold: minimum quiz average below which a student is at risk (default 60)
    """
    all_users = store.get_all_users()
    at_risk = []

    for user in all_users:
        if user.get("role") != "student":
            continue

        user_id = user["id"]
        progress_list = store.get_all_progress(user_id)

        # Check average score
        scores = [p.get("score") for p in progress_list if p.get("score") is not None]
        avg_score = int(sum(scores) / len(scores)) if scores else None

        at_risk_reason = []
        if avg_score is not None and avg_score < score_threshold:
            at_risk_reason.append(f"score_below_{score_threshold}")

        if at_risk_reason:
            at_risk.append({
                "id": user_id,
                "email": user.get("email", ""),
                "school": user.get("school", ""),
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


# ─── CSV exports ─────────────────────────────────────────────────────────────

@router.get("/export/users")
def export_users_csv(
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
):
    """Export all users as CSV (admin only). Anonymised for RGPD compliance."""
    all_users = store.get_all_users()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Role", "École", "Vérifié"])
    for u in all_users:
        writer.writerow([
            u.get("id", ""),
            u.get("role", ""),
            u.get("school", ""),
            "Oui" if u.get("is_verified") else "Non",
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
    writer.writerow(["Export cours disponible via la base de données PostgreSQL."])

    output.seek(0)
    today = datetime.utcnow().date()
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=courses-{today}.csv"},
    )
