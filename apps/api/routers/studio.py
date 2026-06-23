"""
Studio IA — Pipelines de génération de contenu.
Phase 3 : Excel → Quiz
Phase 4 : Vidéo + Slides → Cours
"""
import io
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional

from core.deps import require_role
from core.store import CurrentUser
from services.ai import (
    generate_quiz_from_content,
    generate_course_from_content,
    generate_flashcards_from_content,
)
from services.transcription import (
    transcribe_audio, extract_pptx_text, extract_pdf_text, extract_youtube_id
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/studio", tags=["studio"])

TEACHER_ROLES = ("teacher", "admin", "superuser")


# ── Schemas ───────────────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: list[str]
    correct: str
    explanation: str
    difficulty: str
    source_row: Optional[int] = None


class GeneratedQuiz(BaseModel):
    quiz_title: str
    difficulty: str
    language: str
    questions: list[QuizQuestion]


class SaveQuizRequest(BaseModel):
    course_id: str
    quiz: GeneratedQuiz


class GeneratedCourse(BaseModel):
    title: str
    content: str  # Markdown complet
    level: str
    language: str
    sources_used: list[str]


class SaveCourseRequest(BaseModel):
    title: str
    content: str
    level: str
    language: str
    category: Optional[str] = None
    school: Optional[str] = None


class FlashcardsRequest(BaseModel):
    content: str
    n_cards: int = Field(default=10, ge=1, le=50)
    language: str = "fr"
    title: Optional[str] = None


class Flashcard(BaseModel):
    id: int
    front: str
    back: str


class GeneratedFlashcards(BaseModel):
    title: str
    language: str
    cards: list[Flashcard]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_excel_content(file_bytes: bytes) -> str:
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl non installé")

    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    lines = []
    headers = None

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        values = [str(v).strip() if v is not None else "" for v in row]
        if not any(values):
            continue
        if i == 0:
            headers = values
            lines.append("En-têtes: " + " | ".join(headers))
        else:
            if headers:
                entry = " | ".join(f"{headers[j] if j < len(headers) else f'Col{j}'}: {v}" for j, v in enumerate(values) if v)
            else:
                entry = " | ".join(v for v in values if v)
            if entry:
                lines.append(f"Ligne {i}: {entry}")
        if i > 200:
            lines.append("... (tronqué à 200 lignes)")
            break

    wb.close()
    return "\n".join(lines)


# ── Pipeline 1 : Excel → Quiz ─────────────────────────────────────────────────

@router.post("/excel-to-quiz", response_model=GeneratedQuiz)
async def excel_to_quiz(
    file: UploadFile = File(...),
    n_questions: int = Form(default=5, ge=1, le=20),
    difficulty: str = Form(default="intermédiaire"),
    language: str = Form(default="fr"),
    quiz_title: Optional[str] = Form(default=None),
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Fichier Excel (.xlsx) requis")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 MB)")

    content_bytes = await file.read()
    try:
        extracted = _extract_excel_content(content_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible de lire le fichier Excel: {e}")

    if not extracted.strip():
        raise HTTPException(status_code=400, detail="Le fichier Excel est vide")

    try:
        quiz = await generate_quiz_from_content(
            content=extracted,
            n_questions=n_questions,
            difficulty=difficulty,
            language=language,
            quiz_title=quiz_title or (file.filename.rsplit(".", 1)[0] if file.filename else "Quiz"),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return GeneratedQuiz(**quiz)


@router.post("/save-quiz")
async def save_quiz(
    body: SaveQuizRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    # TODO: persist quiz to DB course blocks (post-MVP)
    return {"message": "Quiz sauvegardé", "course_id": body.course_id, "questions_count": len(body.quiz.questions)}


# ── Pipeline 2 : Vidéo + Slides → Cours ──────────────────────────────────────

@router.post("/video-to-course", response_model=GeneratedCourse)
async def video_to_course(
    title: str = Form(...),
    level: str = Form(default="intermediate"),
    language: str = Form(default="fr"),
    n_sections: int = Form(default=4, ge=2, le=8),
    youtube_url: Optional[str] = Form(default=None),
    video_file: Optional[UploadFile] = File(default=None),
    slides_file: Optional[UploadFile] = File(default=None),
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """
    Pipeline 2 — Vidéo + Slides → Cours Markdown.
    Sources acceptées :
      - URL YouTube (résumé contextuel utilisé dans le prompt)
      - Fichier vidéo/audio MP4/WAV/MP3 (transcrit via Whisper)
      - Fichier PPTX ou PDF (extrait textuellement)
    """
    if not youtube_url and not video_file and not slides_file:
        raise HTTPException(status_code=400, detail="Au moins une source requise (URL YouTube, vidéo, ou slides)")

    sources_used = []
    transcription = ""
    slides_content = ""

    # ── Transcription ─────────────────────────────────────────────────────────
    if youtube_url and youtube_url.strip():
        yt_id = extract_youtube_id(youtube_url.strip())
        if yt_id:
            transcription = f"[Vidéo YouTube : {youtube_url}]\n[ID: {yt_id}]\nContenu de la vidéo à analyser selon le titre et la thématique du cours."
            sources_used.append(f"YouTube: {youtube_url}")
        else:
            transcription = f"[URL vidéo externe : {youtube_url}]"
            sources_used.append(f"Vidéo: {youtube_url}")

    if video_file and video_file.filename:
        allowed_video = (".mp4", ".mov", ".avi", ".mp3", ".wav", ".m4a", ".webm")
        if not any(video_file.filename.lower().endswith(ext) for ext in allowed_video):
            raise HTTPException(status_code=400, detail=f"Format vidéo non supporté. Acceptés: {', '.join(allowed_video)}")
        video_bytes = await video_file.read()
        if len(video_bytes) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Fichier vidéo trop volumineux (max 100 MB)")
        logger.info("Transcription fichier vidéo: %s (%d bytes)", video_file.filename, len(video_bytes))
        transcription = await transcribe_audio(video_bytes, video_file.filename)
        sources_used.append(f"Vidéo: {video_file.filename}")

    # ── Extraction slides ─────────────────────────────────────────────────────
    if slides_file and slides_file.filename:
        slides_bytes = await slides_file.read()
        fname = slides_file.filename.lower()
        if fname.endswith(".pptx") or fname.endswith(".ppt"):
            slides_content = extract_pptx_text(slides_bytes)
            sources_used.append(f"Slides PPTX: {slides_file.filename}")
        elif fname.endswith(".pdf"):
            slides_content = extract_pdf_text(slides_bytes)
            sources_used.append(f"PDF: {slides_file.filename}")
        else:
            raise HTTPException(status_code=400, detail="Format slides non supporté. Acceptés: .pptx, .pdf")

    if not transcription and not slides_content:
        raise HTTPException(status_code=422, detail="Aucun contenu extrait des sources fournies")

    # ── Génération du cours ───────────────────────────────────────────────────
    try:
        content = await generate_course_from_content(
            transcription=transcription,
            slides_content=slides_content,
            title=title,
            level=level,
            language=language,
            n_sections=n_sections,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return GeneratedCourse(
        title=title,
        content=content,
        level=level,
        language=language,
        sources_used=sources_used,
    )


@router.post("/save-course")
async def save_course(
    body: SaveCourseRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Sauvegarde un cours généré. TODO: persist to DB via courses router (post-MVP)."""
    import uuid
    course_id = str(uuid.uuid4())
    return {"message": "Cours sauvegardé", "course_id": course_id, "title": body.title}


# ── Pipeline 3 : Contenu → Flashcards (Phase 11) ─────────────────────────────

@router.post("/flashcards", response_model=GeneratedFlashcards)
async def content_to_flashcards(
    body: FlashcardsRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Génère des flashcards de révision à partir d'un contenu de cours (markdown/texte)."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Contenu requis")
    try:
        data = await generate_flashcards_from_content(
            content=body.content,
            n_cards=body.n_cards,
            language=body.language,
            title=body.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return GeneratedFlashcards(**data)


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
def studio_health():
    from core.config import settings
    from services.llm import get_llm_provider

    provider = get_llm_provider()
    return {
        "studio": "ok",
        "ai_configured": provider is not None,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": provider.model if provider else None,
        "transcription_configured": bool(settings.OPENAI_API_KEY),
        "pipelines": ["excel-to-quiz", "video-to-course", "flashcards"],
    }
