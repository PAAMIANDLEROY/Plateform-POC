"""
Configuration centralisée du logging applicatif.

Sans config explicite, le logger racine est à WARNING : tous les `logger.info`
de l'app sont invisibles (c'est ce qui a masqué les diagnostics email/migrations
en production). `configure_logging()` aligne le niveau sur `LOG_LEVEL` (défaut INFO)
et installe un format lisible, pour les workers uvicorn comme pour le reste.
"""
import logging

from core.config import settings


def configure_logging() -> None:
    """Configure le logger racine selon settings.LOG_LEVEL (idempotent via force=True)."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        force=True,
    )
