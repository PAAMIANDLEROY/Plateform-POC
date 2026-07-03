"""
Router cohortes (Lot 3 — voir ROLES-ET-DROITS.md §5).

Autorisation :
  - un `teacher` ne voit / ne gère que les cohortes dont il est owner ;
  - `admin` / `super_admin` voient et gèrent toutes les cohortes.

Métriques : calculées à partir des vraies données de `UserCourseProgress`
(complétion, score moyen, apprenants à risque). Aucune stat de démonstration.
Le temps passé n'est pas tracké → non exposé (plutôt qu'inventé).
"""
import uuid
from datetime import datetime, timezone, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.store import CurrentUser
from core.deps import require_role
from core.roles import ADMIN_ROLES, TEACHER_ROLES
from database import get_db
from models.cohort import Cohort, CohortMember, CohortCourse, CohortStatus, MemberStatus
from models.course import Course, UserCourseProgress
from models.user import User

router = APIRouter(prefix="/api/v1/cohorts", tags=["cohorts"])

# Seuils « à risque » (mêmes défauts que /api/v1/analytics/at-risk).
INACTIVITY_DAYS = 7
INACTIVE_DAYS = 21
SCORE_THRESHOLD = 60


# ── Schemas ───────────────────────────────────────────────────────────────────

class CohortOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    school: Optional[str]
    status: str
    owner_id: str
    start_date: Optional[str]
    end_date: Optional[str]
    enrolled_count: int
    assigned_course_ids: list[str]
    completion_rate: int
    avg_score: Optional[int]
    at_risk_count: int
    created_at: Optional[str]


class MemberOut(BaseModel):
    user_id: str
    name: str
    email: str
    school: Optional[str]
    status: str
    joined_at: Optional[str]
    completion: int
    avg_score: Optional[int]
    courses_completed: int
    total_courses: int
    days_inactive: Optional[int]
    last_activity: Optional[str]


class CohortDetailOut(CohortOut):
    members: list[MemberOut]


class CreateCohortRequest(BaseModel):
    name: str
    description: Optional[str] = None
    school: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class UpdateCohortRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    school: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class AddMemberRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class GrantCourseRequest(BaseModel):
    course_id: str


# ── Métriques (vraies données) ────────────────────────────────────────────────

def _iso(d) -> Optional[str]:
    return d.isoformat() if d else None


def _member_metrics(db: Session, cohort: Cohort) -> dict[str, dict]:
    """
    Calcule, pour chaque membre, ses métriques réelles sur les cours assignés
    à la cohorte : complétion moyenne, score moyen, cours complétés, inactivité, statut.
    """
    course_ids = [cc.course_id for cc in cohort.courses]
    members = cohort.members
    total_courses = len(course_ids)
    result: dict[str, dict] = {}
    if not members:
        return result

    member_ids = [m.user_id for m in members]
    rows = []
    if course_ids:
        rows = db.query(UserCourseProgress).filter(
            UserCourseProgress.user_id.in_(member_ids),
            UserCourseProgress.course_id.in_(course_ids),
        ).all()

    by_user: dict[str, dict[str, UserCourseProgress]] = {}
    for r in rows:
        by_user.setdefault(r.user_id, {})[r.course_id] = r

    now = datetime.now(timezone.utc)
    for m in members:
        progs = by_user.get(m.user_id, {})

        if total_courses:
            completion = round(sum((progs[c].progress_pct if c in progs else 0) for c in course_ids) / total_courses)
            completed = sum(1 for c in course_ids if c in progs and progs[c].completed_at)
            scores = [progs[c].score for c in course_ids if c in progs and progs[c].score is not None]
        else:
            completion, completed, scores = 0, 0, []

        avg_score = round(sum(scores) / len(scores)) if scores else None

        updates = [progs[c].updated_at for c in progs if progs[c].updated_at]
        last_dt = max(updates) if updates else None
        if last_dt and last_dt.tzinfo is None:  # SQLite renvoie du naïf → on suppose UTC
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        days_inactive = (now - last_dt).days if last_dt else None

        # Statut dérivé (aucune valeur inventée).
        if total_courses and completion >= 100:
            member_status = "completed"
        elif (avg_score is not None and avg_score < SCORE_THRESHOLD) or (
            days_inactive is not None and INACTIVITY_DAYS <= days_inactive < INACTIVE_DAYS
        ):
            member_status = "at-risk"
        elif days_inactive is None or days_inactive >= INACTIVE_DAYS:
            member_status = "inactive"
        else:
            member_status = "active"

        result[m.user_id] = {
            "completion": completion,
            "avg_score": avg_score,
            "courses_completed": completed,
            "total_courses": total_courses,
            "days_inactive": days_inactive,
            "last_activity": _iso(last_dt),
            "status": member_status,
        }
    return result


def _aggregate(metrics: dict[str, dict]) -> tuple[int, Optional[int], int]:
    """Agrège les métriques membres en KPIs de cohorte (complétion, score, à risque)."""
    ms = list(metrics.values())
    if not ms:
        return 0, None, 0
    completion_rate = round(sum(m["completion"] for m in ms) / len(ms))
    score_vals = [m["avg_score"] for m in ms if m["avg_score"] is not None]
    avg_score = round(sum(score_vals) / len(score_vals)) if score_vals else None
    at_risk = sum(1 for m in ms if m["status"] == "at-risk")
    return completion_rate, avg_score, at_risk


def _cohort_out(db: Session, c: Cohort) -> CohortOut:
    metrics = _member_metrics(db, c)
    completion_rate, avg_score, at_risk = _aggregate(metrics)
    return CohortOut(
        id=c.id,
        name=c.name,
        description=c.description,
        school=c.school,
        status=c.status.value if hasattr(c.status, "value") else str(c.status),
        owner_id=c.owner_id,
        start_date=_iso(c.start_date),
        end_date=_iso(c.end_date),
        enrolled_count=len(c.members),
        assigned_course_ids=[cc.course_id for cc in c.courses],
        completion_rate=completion_rate,
        avg_score=avg_score,
        at_risk_count=at_risk,
        created_at=_iso(c.created_at),
    )


def _member_out(m: CohortMember, metrics: dict) -> MemberOut:
    u = m.user
    name = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip() if u else ""
    mm = metrics.get(m.user_id, {})
    return MemberOut(
        user_id=m.user_id,
        name=name or (u.email if u else m.user_id),
        email=u.email if u else "",
        school=getattr(u, "school", None) if u else None,
        status=mm.get("status", "active"),
        joined_at=_iso(m.joined_at),
        completion=mm.get("completion", 0),
        avg_score=mm.get("avg_score"),
        courses_completed=mm.get("courses_completed", 0),
        total_courses=mm.get("total_courses", 0),
        days_inactive=mm.get("days_inactive"),
        last_activity=mm.get("last_activity"),
    )


# ── Helpers d'autorisation ────────────────────────────────────────────────────

def _load_cohort(db: Session, cohort_id: str) -> Cohort:
    c = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cohorte introuvable")
    return c


def _require_manage(current_user: CurrentUser, cohort: Cohort) -> None:
    """Owner de la cohorte, ou admin/super_admin."""
    if current_user.role not in ADMIN_ROLES and cohort.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne gérez pas cette cohorte.")


def _validate_status(value: Optional[str]) -> None:
    if value is not None and value not in {s.value for s in CohortStatus}:
        raise HTTPException(status_code=400, detail=f"Statut invalide : {value}")


# ── Cohortes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CohortOut])
def list_cohorts(
    status_filter: Optional[str] = None,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    """Liste les cohortes. Un teacher ne voit que les siennes ; admin+ voient tout."""
    query = db.query(Cohort)
    if current_user.role not in ADMIN_ROLES:
        query = query.filter(Cohort.owner_id == current_user.id)
    if status_filter:
        query = query.filter(Cohort.status == status_filter)
    return [_cohort_out(db, c) for c in query.order_by(Cohort.created_at.desc()).all()]


@router.post("", response_model=CohortOut, status_code=status.HTTP_201_CREATED)
def create_cohort(
    body: CreateCohortRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    _validate_status(body.status)
    cohort = Cohort(
        id=str(uuid.uuid4()),
        name=body.name,
        description=body.description,
        school=body.school,
        status=CohortStatus(body.status) if body.status else CohortStatus.draft,
        owner_id=current_user.id,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return _cohort_out(db, cohort)


@router.get("/{cohort_id}", response_model=CohortDetailOut)
def get_cohort(
    cohort_id: str,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    metrics = _member_metrics(db, cohort)
    base = _cohort_out(db, cohort)
    return CohortDetailOut(
        **base.model_dump(),
        members=[_member_out(m, metrics) for m in cohort.members],
    )


@router.patch("/{cohort_id}", response_model=CohortOut)
def update_cohort(
    cohort_id: str,
    body: UpdateCohortRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    _validate_status(body.status)

    data = body.model_dump(exclude_none=True)
    for field, value in data.items():
        if field == "status":
            value = CohortStatus(value)
        setattr(cohort, field, value)

    db.commit()
    db.refresh(cohort)
    return _cohort_out(db, cohort)


@router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cohort(
    cohort_id: str,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    db.delete(cohort)
    db.commit()


# ── Membres ───────────────────────────────────────────────────────────────────

@router.get("/{cohort_id}/members", response_model=list[MemberOut])
def list_members(
    cohort_id: str,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    metrics = _member_metrics(db, cohort)
    return [_member_out(m, metrics) for m in cohort.members]


@router.post("/{cohort_id}/members", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def add_member(
    cohort_id: str,
    body: AddMemberRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)

    if not body.user_id and not body.email:
        raise HTTPException(status_code=400, detail="user_id ou email requis.")

    q = db.query(User)
    user = q.filter(User.id == body.user_id).first() if body.user_id else q.filter(User.email == body.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    existing = db.query(CohortMember).filter(
        CohortMember.cohort_id == cohort_id, CohortMember.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Déjà membre de cette cohorte.")

    member = CohortMember(
        id=str(uuid.uuid4()),
        cohort_id=cohort_id,
        user_id=user.id,
        status=MemberStatus.active,
    )
    db.add(member)
    db.commit()
    db.refresh(cohort)
    metrics = _member_metrics(db, cohort)
    return _member_out(member, metrics)


@router.delete("/{cohort_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    cohort_id: str,
    user_id: str,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    member = db.query(CohortMember).filter(
        CohortMember.cohort_id == cohort_id, CohortMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    db.delete(member)
    db.commit()


# ── Accès aux cours (catalogue → cohorte) ─────────────────────────────────────

@router.post("/{cohort_id}/courses", status_code=status.HTTP_201_CREATED)
def grant_course(
    cohort_id: str,
    body: GrantCourseRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    """Donne à la cohorte l'accès à un cours du catalogue."""
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)

    course = db.query(Course).filter(Course.id == body.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")

    existing = db.query(CohortCourse).filter(
        CohortCourse.cohort_id == cohort_id, CohortCourse.course_id == body.course_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Cours déjà accordé à cette cohorte.")

    link = CohortCourse(
        id=str(uuid.uuid4()),
        cohort_id=cohort_id,
        course_id=body.course_id,
        granted_by=current_user.id,
    )
    db.add(link)
    db.commit()
    return {"cohort_id": cohort_id, "course_id": body.course_id}


@router.delete("/{cohort_id}/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_course(
    cohort_id: str,
    course_id: str,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    cohort = _load_cohort(db, cohort_id)
    _require_manage(current_user, cohort)
    link = db.query(CohortCourse).filter(
        CohortCourse.cohort_id == cohort_id, CohortCourse.course_id == course_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Accès au cours introuvable")
    db.delete(link)
    db.commit()
