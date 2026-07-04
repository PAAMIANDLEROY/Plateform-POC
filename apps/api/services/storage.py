"""
Stockage de fichiers via Supabase Storage (API REST, pas de SDK — httpx suffit).

Config : SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET (voir core/config.py).
La clé service_role reste côté serveur : le navigateur n'accède jamais directement au bucket.
"""
import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def _base() -> str:
    if not is_configured():
        raise RuntimeError("Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY).")
    return settings.SUPABASE_URL.rstrip("/")


def upload_file(content: bytes, path: str, content_type: str | None) -> str:
    """Pousse `content` dans le bucket au chemin `path`. Renvoie le chemin stocké."""
    base = _base()
    url = f"{base}/storage/v1/object/{settings.SUPABASE_BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        # `apikey` requis par le nouveau format de clés Supabase (sb_secret_…).
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }
    resp = httpx.post(url, content=content, headers=headers, timeout=60.0)
    if resp.status_code not in (200, 201):
        detail = resp.text[:200]
        logger.warning("Upload Supabase échoué (%s) sur bucket '%s': %s",
                       resp.status_code, settings.SUPABASE_BUCKET, detail)
        raise RuntimeError(f"Upload Supabase échoué ({resp.status_code}): {detail}")
    return path


def public_url(path: str) -> str:
    """URL publique d'un objet (nécessite un bucket PUBLIC côté Supabase)."""
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_BUCKET}/{path}"


def create_signed_url(path: str, expires_in: int = 3600) -> str | None:
    """URL signée temporaire pour télécharger un fichier privé. None si indisponible."""
    if not is_configured():
        return None
    base = _base()
    url = f"{base}/storage/v1/object/sign/{settings.SUPABASE_BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }
    try:
        resp = httpx.post(url, json={"expiresIn": expires_in}, headers=headers, timeout=30.0)
        if resp.status_code != 200:
            return None
        data = resp.json()
        signed = data.get("signedURL") or data.get("signedUrl")
        return f"{base}/storage/v1{signed}" if signed else None
    except Exception as e:  # réseau, JSON… : on dégrade proprement
        logger.warning("Signed URL Supabase indisponible: %s", e)
        return None
