"""
Utilities for converting SQLAlchemy User models to CurrentUser DTOs.
"""
from core.store import CurrentUser


def user_to_current(user) -> CurrentUser:
    """
    Convert a SQLAlchemy User ORM object to a CurrentUser DTO.
    Uses getattr with defaults to handle columns that may not exist
    on older DB rows (before migration 0005).
    """
    consent_updated = getattr(user, "consent_updated_at", None)
    return CurrentUser({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "school": getattr(user, "school", None) or "",
        "bio": getattr(user, "bio", None) or "",
        "avatar_url": getattr(user, "avatar_url", None),
        "linkedin": getattr(user, "linkedin", None) or "",
        "github": getattr(user, "github", None) or "",
        "refresh_token": user.refresh_token,
        "consent": {
            "analytics": getattr(user, "consent_analytics", False) or False,
            "tracking": getattr(user, "consent_tracking", False) or False,
            "updated_at": consent_updated.isoformat() if consent_updated else None,
        },
        "is_anonymized": getattr(user, "is_anonymized", False) or False,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    })
