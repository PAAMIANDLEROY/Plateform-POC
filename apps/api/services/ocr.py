"""
OCR de documents via l'API Mistral (Document AI / OCR).
Utilisé en repli quand l'extraction texte (pdfplumber) ne donne rien — typiquement
un PDF composé d'images (slides exportées, scans).
"""
import base64
import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

_OCR_URL = "https://api.mistral.ai/v1/ocr"


def is_ocr_available() -> bool:
    return bool(settings.MISTRAL_API_KEY)


def ocr_pdf_mistral(pdf_bytes: bytes) -> str:
    """
    Envoie le PDF à l'OCR Mistral et renvoie le texte (markdown concaténé des pages).
    Renvoie "" si l'OCR n'est pas configuré ou échoue (dégradation propre).
    """
    if not settings.MISTRAL_API_KEY:
        return ""

    b64 = base64.b64encode(pdf_bytes).decode("ascii")
    payload = {
        "model": "mistral-ocr-latest",
        "document": {"type": "document_url", "document_url": f"data:application/pdf;base64,{b64}"},
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
        text = "\n\n".join((p.get("markdown") or "") for p in pages).strip()
        logger.info("Mistral OCR: %d page(s), %d chars", len(pages), len(text))
        return text
    except Exception as e:  # réseau, JSON, etc.
        logger.warning("Mistral OCR indisponible: %s", e)
        return ""
