"""
OCR de documents via l'API Mistral (Document AI / OCR).
Repli quand pdfplumber ne donne rien (PDF-image : slides, scans).
Les images des pages sont ré-uploadées dans Supabase Storage et référencées dans le markdown
→ elles apparaissent dans le cours. (Nécessite un bucket PUBLIC pour l'affichage.)
"""
import base64
import logging
import uuid

import httpx

from core.config import settings
from services import storage

logger = logging.getLogger(__name__)

_OCR_URL = "https://api.mistral.ai/v1/ocr"


def is_ocr_available() -> bool:
    return bool(settings.MISTRAL_API_KEY)


def _upload_ocr_image(image_b64: str) -> str | None:
    """Décode une image base64 (data-URI ou brut) et l'upload → URL publique, ou None."""
    try:
        content_type = "image/jpeg"
        data = image_b64
        if image_b64.startswith("data:"):
            header, _, data = image_b64.partition(",")
            if ":" in header and ";" in header:
                content_type = header.split(":", 1)[1].split(";", 1)[0]
        raw = base64.b64decode(data)
        ext = "png" if "png" in content_type else "jpg"
        path = f"ocr-images/{uuid.uuid4().hex}.{ext}"
        storage.upload_file(raw, path, content_type)
        return storage.public_url(path)
    except Exception as e:
        logger.warning("Upload image OCR échoué: %s", e)
        return None


def ocr_pdf_mistral(pdf_bytes: bytes) -> str:
    """
    OCR Mistral → markdown concaténé des pages. Les images sont uploadées et leurs
    références réécrites vers l'URL publique. Renvoie "" si non configuré ou en cas d'échec.
    """
    if not settings.MISTRAL_API_KEY:
        return ""

    b64 = base64.b64encode(pdf_bytes).decode("ascii")
    payload = {
        "model": "mistral-ocr-latest",
        "document": {"type": "document_url", "document_url": f"data:application/pdf;base64,{b64}"},
        "include_image_base64": True,
    }
    headers = {
        "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = httpx.post(_OCR_URL, json=payload, headers=headers, timeout=180.0)
        if resp.status_code != 200:
            logger.warning("Mistral OCR échoué (%s): %s", resp.status_code, resp.text[:300])
            return ""
        data = resp.json()
        pages = data.get("pages", []) or []

        parts = []
        for page in pages:
            md = page.get("markdown") or ""
            for img in page.get("images") or []:
                img_id = img.get("id")
                img_b64 = img.get("image_base64")
                if not img_id or not img_b64:
                    continue
                url = _upload_ocr_image(img_b64)
                if url:
                    # Réécrit la référence markdown ![...](img_id) → ![...](url)
                    md = md.replace(f"]({img_id})", f"]({url})")
            parts.append(md)

        text = "\n\n".join(parts).strip()
        logger.info("Mistral OCR: %d page(s), %d chars", len(pages), len(text))
        return text
    except Exception as e:
        logger.warning("Mistral OCR indisponible: %s", e)
        return ""
