"""
Contrôle d'accès aux contenus par niveau (Lot 4 — voir ROLES-ET-DROITS.md §4).

Trois bases de cours :
  - `public`  : tout le monde (base « simple ») ;
  - `hiparis` : élèves (rôle `student`, domaine autorisé) et au-dessus (base « Hi! PARIS ») ;
  - `cohort`  : réservé aux membres d'une cohorte à laquelle le cours a été accordé.

Les enseignants et le staff (`teacher`/`admin`/`super_admin`) voient tout le catalogue publié
(pour curation et assignation aux cohortes).
"""
from sqlalchemy.orm import Session

from core.roles import ADMIN_ROLES, TEACHER_ROLES
from models.cohort import CohortMember, CohortCourse


def cohort_course_ids_for_user(db: Session, user_id: str) -> set[str]:
    """Ids des cours auxquels l'utilisateur a accès via ses cohortes."""
    rows = (
        db.query(CohortCourse.course_id)
        .join(CohortMember, CohortMember.cohort_id == CohortCourse.cohort_id)
        .filter(CohortMember.user_id == user_id)
        .all()
    )
    return {r[0] for r in rows}


def allowed_access_levels(role: str) -> list[str]:
    """Niveaux d'accès « libres » (hors cohorte) pour un rôle non-staff."""
    levels = ["public"]
    if role == "student":
        levels.append("hiparis")
    return levels


def _value(x, default: str = "") -> str:
    return x.value if hasattr(x, "value") else str(x if x is not None else default)


def can_view_course(current_user, course, cohort_ids: set[str]) -> bool:
    """Vrai si `current_user` peut consulter `course` (statut + niveau d'accès)."""
    role = current_user.role

    # Cours non publié : seulement le propriétaire ou un admin/super_admin.
    if _value(course.status) != "published":
        return course.created_by == current_user.id or role in ADMIN_ROLES

    # Enseignants et staff : accès à tout le catalogue publié.
    if role in TEACHER_ROLES:
        return True

    level = _value(course.access_level, "public")
    if level == "public":
        return True
    if level == "hiparis":
        return role == "student"
    if level == "cohort":
        return course.id in cohort_ids
    return False
