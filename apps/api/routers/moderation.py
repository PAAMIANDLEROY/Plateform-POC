"""
Router modération & audit (Lot 5 — voir ROLES-ET-DROITS.md §7).

  - GET  /api/v1/audit-logs        : consultation du journal (admin+).
  - POST /api/v1/reports           : signaler un contenu (tout utilisateur connecté).
  - GET  /api/v1/reports           : file des signalements (admin+).
  - PATCH /api/v1/reports/{id}     : traiter un signalement (admin+), avec masquage optionnel.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.store import CurrentUser
from core.deps import get_current_user, require_role
from core.roles import ADMIN_ROLES
from core.audit import log_action
from database import get_db
from models.audit import AuditLog, Report
from models.course import Course

router = APIRouter(prefix="/api/v1", tags=["moderation"])

VALID_TARGET_TYPES = {"course", "video", "mooc", "comment", "user", "app"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    meta: Optional[dict]
    created_at: Optional[str]


class AuditLogList(BaseModel):
    total: int
    items: list[AuditLogOut]


class ReportOut(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    status: str
    resolution: Optional[str]
    resolved_by: Optional[str]
    created_at: Optional[str]
    resolved_at: Optional[str]


class CreateReportRequest(BaseModel):
    target_type: str
    target_id: str
    reason: str


class ResolveReportRequest(BaseModel):
    status: str                      # resolved | dismissed
    resolution: Optional[str] = None
    hide: bool = False               # si True + target course : dépublie (archive)


def _iso(d) -> Optional[str]:
    return d.isoformat() if d else None


def _audit_out(a: AuditLog) -> AuditLogOut:
    return AuditLogOut(
        id=a.id, actor_id=a.actor_id, action=a.action,
        target_type=a.target_type, target_id=a.target_id,
        meta=a.meta, created_at=_iso(a.created_at),
    )


def _report_out(r: Report) -> ReportOut:
    return ReportOut(
        id=r.id, reporter_id=r.reporter_id, target_type=r.target_type, target_id=r.target_id,
        reason=r.reason, status=r.status, resolution=r.resolution, resolved_by=r.resolved_by,
        created_at=_iso(r.created_at), resolved_at=_iso(r.resolved_at),
    )


# ── Audit log ─────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=AuditLogList)
def list_audit_logs(
    action: Optional[str] = None,
    actor_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Journal des actions sensibles (admin & super_admin)."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    total = query.count()
    rows = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return AuditLogList(total=total, items=[_audit_out(a) for a in rows])


# ── Signalements ──────────────────────────────────────────────────────────────

@router.post("/reports", response_model=ReportOut, status_code=201)
def create_report(
    body: CreateReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Signaler un contenu (tout utilisateur connecté)."""
    if body.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(status_code=400, detail=f"target_type invalide : {body.target_type}")
    if not body.reason.strip():
        raise HTTPException(status_code=400, detail="Motif requis.")

    report = Report(
        id=str(uuid.uuid4()),
        reporter_id=current_user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        reason=body.reason.strip(),
        status="open",
    )
    db.add(report)
    log_action(db, current_user.id, "report_create", body.target_type, body.target_id)
    db.commit()
    db.refresh(report)
    return _report_out(report)


@router.get("/reports", response_model=list[ReportOut])
def list_reports(
    status: Optional[str] = None,
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """File des signalements (admin+). Filtre optionnel par statut."""
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    rows = query.order_by(Report.created_at.desc()).all()
    return [_report_out(r) for r in rows]


@router.patch("/reports/{report_id}", response_model=ReportOut)
def resolve_report(
    report_id: str,
    body: ResolveReportRequest,
    current_user: CurrentUser = Depends(require_role(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    """Traiter un signalement (admin+). `hide=True` dépublie un cours signalé."""
    if body.status not in ("resolved", "dismissed"):
        raise HTTPException(status_code=400, detail="Statut invalide (resolved | dismissed).")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement introuvable")

    # Masquage : dépublie le contenu (cours) visé.
    if body.hide and report.target_type == "course":
        course = db.query(Course).filter(Course.id == report.target_id).first()
        if course:
            course.status = "archived"
            log_action(db, current_user.id, "content_hide", "course", course.id)

    report.status = body.status
    report.resolution = (body.resolution or "").strip() or None
    report.resolved_by = current_user.id
    report.resolved_at = datetime.now(timezone.utc)
    log_action(db, current_user.id, f"report_{body.status}", report.target_type, report.target_id,
               {"report_id": report.id})
    db.commit()
    db.refresh(report)
    return _report_out(report)
