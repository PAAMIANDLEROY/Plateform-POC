"""
Gestion des domaines email autorisés.

Les domaines sont chargés depuis la table `allowed_domains` en Supabase au démarrage
et mis en cache en mémoire (évite un aller-retour DB à chaque login).

Appeler `load_domains_from_db()` dans le lifespan FastAPI après les migrations.
"""
import logging
from typing import Optional

from sqlalchemy.orm import Session

from core.config import settings

logger = logging.getLogger(__name__)

# ── Cache en mémoire ──────────────────────────────────────────────────────────
_cached_domains: set[str] = set()


def get_cached_domains() -> set[str]:
    """Retourne le set de domaines actuellement en cache."""
    return _cached_domains


def load_domains_from_db() -> None:
    """
    Charge les domaines depuis la table `allowed_domains` et les met en cache.
    Appelé une seule fois au démarrage de l'API.
    Fallback sur settings.ALLOWED_DOMAINS si la DB est indisponible ou vide.
    """
    global _cached_domains
    try:
        from database import SessionLocal  # import local pour éviter les cycles

        db: Session = SessionLocal()
        try:
            result = db.execute(
                __import__("sqlalchemy").text(
                    "SELECT domain FROM allowed_domains"
                )
            )
            domains = {row[0].lower().strip() for row in result}
        finally:
            db.close()

        if domains:
            _cached_domains = domains
            logger.info("✅ %d domaine(s) chargé(s) depuis Supabase : %s", len(domains), sorted(domains))
        else:
            _fallback_to_env()

    except Exception as exc:
        logger.warning("⚠️  Impossible de charger les domaines depuis la DB : %s — fallback env", exc)
        _fallback_to_env()


def _fallback_to_env() -> None:
    """Remplit le cache depuis la variable d'environnement ALLOWED_DOMAINS."""
    global _cached_domains
    env_domains = set(settings.allowed_domains_list)
    _cached_domains = env_domains
    logger.info("ℹ️  Domaines chargés depuis .env : %s", sorted(env_domains))


def is_domain_allowed(email: str) -> bool:
    """Vérifie si le domaine de l'email est autorisé (check dans le cache)."""
    domain = email.split("@")[-1].lower()
    return domain in _cached_domains


def reload_domains_from_db() -> None:
    """
    Recharge les domaines depuis la DB (utile après ajout/suppression d'un domaine
    via l'interface admin, sans redémarrer le serveur).
    """
    load_domains_from_db()
