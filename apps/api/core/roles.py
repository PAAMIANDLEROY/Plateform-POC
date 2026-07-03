"""
Hiérarchie des rôles et helpers d'autorisation.

Ordre croissant de privilège :
    public < student < teacher < admin < super_admin

Voir ROLES-ET-DROITS.md pour le modèle complet. Règle de délégation (§6) :
chacun ne gère que les rôles STRICTEMENT inférieurs au sien.
"""
from models.user import UserRole

# Niveau numérique par rôle (plus grand = plus de privilèges).
ROLE_LEVEL: dict[str, int] = {
    UserRole.public.value: 0,
    UserRole.student.value: 1,
    UserRole.teacher.value: 2,
    UserRole.admin.value: 3,
    UserRole.super_admin.value: 4,
}

# Regroupements pratiques réutilisés par les routers.
TEACHER_ROLES = (UserRole.teacher.value, UserRole.admin.value, UserRole.super_admin.value)
ADMIN_ROLES = (UserRole.admin.value, UserRole.super_admin.value)


def level(role: str) -> int:
    """Niveau numérique d'un rôle. Rôle inconnu → -1 (aucun privilège)."""
    return ROLE_LEVEL.get(role, -1)


def role_at_least(role: str, minimum: str) -> bool:
    """True si `role` est au moins aussi privilégié que `minimum`."""
    return level(role) >= level(minimum)


def can_manage_role(actor_role: str, target_current_role: str, new_role: str) -> bool:
    """
    Règle de délégation (§6) : un acteur peut changer le rôle d'une cible si et
    seulement si la cible ET le nouveau rôle sont STRICTEMENT en dessous de lui.

    Conséquences :
      - un `admin` gère public/student/teacher, mais ni un `admin` ni un `super_admin` ;
      - seul un `super_admin` fabrique/retire des `admin`.
    """
    if new_role not in ROLE_LEVEL:
        return False
    actor = level(actor_role)
    return actor > level(target_current_role) and actor > level(new_role)
