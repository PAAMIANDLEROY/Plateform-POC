"""
Service de transcription vidéo via OpenAI Whisper.
Fallback sur transcription mock si OPENAI_API_KEY absent.
"""
import io
import logging
import tempfile
import os
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

MOCK_TRANSCRIPTION = """
Bienvenue dans ce cours sur les fondamentaux de l'intelligence artificielle.
Aujourd'hui, nous allons explorer les concepts clés qui fondent le machine learning moderne.

Commençons par définir ce qu'est l'apprentissage automatique. Il s'agit d'un ensemble de techniques
permettant à un système informatique d'apprendre à partir de données, sans être explicitement programmé.

La première notion fondamentale est celle de modèle. Un modèle est une fonction mathématique
qui prend des données en entrée et produit une prédiction en sortie.

Ensuite, l'entraînement : c'est le processus par lequel le modèle ajuste ses paramètres
pour minimiser l'erreur sur un jeu de données d'entraînement.

Nous verrons également la validation croisée, technique essentielle pour évaluer
la capacité de généralisation d'un modèle sur de nouvelles données.

Pour conclure cette introduction, retenez que le machine learning repose sur trois piliers :
les données, les algorithmes, et la puissance de calcul.
Dans les prochaines sections, nous approfondirons chacun de ces aspects.
""".strip()


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """
    Transcrit un fichier audio/vidéo via Whisper API.
    Retourne le texte transcrit, ou une transcription mock si l'API n'est pas configurée.
    """
    if not settings.OPENAI_API_KEY:
        logger.info("OPENAI_API_KEY non configuré — transcription mock utilisée")
        return MOCK_TRANSCRIPTION

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        ext = filename.rsplit(".", 1)[-1] if "." in filename else "mp4"
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    language="fr",
                )
            return transcript.text
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error("Erreur Whisper API: %s — fallback mock", e)
        return MOCK_TRANSCRIPTION


def extract_youtube_id(url: str) -> Optional[str]:
    """Extrait l'ID YouTube depuis une URL."""
    import re
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def extract_pptx_text(file_bytes: bytes) -> str:
    """Extrait le texte d'un fichier PPTX slide par slide."""
    try:
        from pptx import Presentation
        prs = Presentation(io.BytesIO(file_bytes))
        lines = []
        for i, slide in enumerate(prs.slides):
            slide_texts = []
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    slide_texts.append(shape.text.strip())
            if slide_texts:
                lines.append(f"[Slide {i + 1}] {' | '.join(slide_texts)}")
        return "\n".join(lines) if lines else "[Aucun texte extrait des slides]"
    except ImportError:
        logger.warning("python-pptx non installé")
        return "[Extraction PPTX indisponible — python-pptx requis]"
    except Exception as e:
        logger.error("Erreur extraction PPTX: %s", e)
        return f"[Erreur extraction PPTX: {e}]"


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extrait le texte d'un fichier PDF page par page."""
    try:
        import pdfplumber
        lines = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text and text.strip():
                    lines.append(f"[Page {i + 1}] {text.strip()}")
        return "\n".join(lines) if lines else "[Aucun texte extrait du PDF]"
    except ImportError:
        logger.warning("pdfplumber non installé")
        return "[Extraction PDF indisponible — pdfplumber requis]"
    except Exception as e:
        logger.error("Erreur extraction PDF: %s", e)
        return f"[Erreur extraction PDF: {e}]"
