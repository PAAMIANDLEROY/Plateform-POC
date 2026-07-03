"""
Journalisation des actions sensibles (Lot 5 — voir ROLES-ET-DROITS.md §7).

Usage typique : appeler `log_action(db, ...)` AVANT le `db.commit()` de l'endpoint,
pour que l'entrée d'audit soit persistée dans la même transaction que l'action.
"""
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from models.audit import AuditLog


def log_action(
    db: Session,
    actor_id: Optional[str],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    meta: Optional[dict] = None,
    commit: bool = False,
) -> AuditLog:
    """
    Ajoute une entrée d'audit. Par défaut ne commit pas (l'endpoint appelant commit
    l'ensemble). Passer commit=True pour un enregistrement autonome.
    """
    entry = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        meta=meta,
    )
    db.add(entry)
    if commit:
        db.commit()
    return entry
