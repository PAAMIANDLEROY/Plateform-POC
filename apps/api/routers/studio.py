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

from sqlalchemy.orm import Session

from core.deps import require_role
from core.store import CurrentUser
from core.audit import log_action
from database import get_db
from models.course import Course, CourseBlock
from services.ai import (
    generate_quiz_from_content,
    generate_course_from_content,
    generate_course_blocks_from_content,
    generate_flashcards_from_content,
    generate_mindmap_from_content,
    generate_study_sheet_from_content,
    generate_faq_from_content,
)
from services.ocr import ocr_pdf_mistral
from services.transcription import (
    transcribe_audio, extract_pptx_text, extract_pdf_text, extract_youtube_id,
    fetch_youtube_transcript,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/studio", tags=["studio"])

TEACHER_ROLES = ("teacher", "admin", "super_admin")


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


class GeneratedBlock(BaseModel):
    type: str          # heading | text | markdown | quiz | divider
    content: dict


class GeneratedCourseBlocks(BaseModel):
    title: str
    blocks: list[GeneratedBlock]
    level: str
    language: str
    sources_used: list[str]


class SaveCourseRequest(BaseModel):
    title: str
    level: str
    language: str
    content: Optional[str] = None        # markdown (pipeline vidéo)
    blocks: Optional[list[dict]] = None  # blocs structurés (pipeline PDF)
    category: Optional[str] = None
    school: Optional[str] = None
    access_level: str = "public"  # public | hiparis | cohort


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


class GenerateFromTextRequest(BaseModel):
    """Entrée commune aux outils dérivés d'un contenu de cours (texte/markdown)."""
    content: str
    language: str = "fr"
    title: Optional[str] = None


class MindMapNode(BaseModel):
    label: str
    children: list["MindMapNode"] = Field(default_factory=list)


class GeneratedMindMap(BaseModel):
    title: str
    root: MindMapNode


MindMapNode.model_rebuild()  # résout la self-référence (Pydantic v2)


class KeyConcept(BaseModel):
    term: str
    definition: str


class GeneratedStudySheet(BaseModel):
    title: str
    language: str
    summary: str
    key_concepts: list[KeyConcept]
    key_points: list[str]


class FAQRequest(BaseModel):
    content: str
    n_items: int = Field(default=6, ge=1, le=30)
    language: str = "fr"
    title: Optional[str] = None


class FAQItem(BaseModel):
    question: str
    answer: str


class GeneratedFAQ(BaseModel):
    title: str
    language: str
    items: list[FAQItem]


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
        # Lien YouTube → on récupère les sous-titres (gratuit, pas de coût de
        # transcription). Si indisponibles, on note la source et le LLM s'appuiera
        # sur les slides / le titre.
        yt_text = fetch_youtube_transcript(youtube_url.strip())
        if yt_text:
            transcription = yt_text
            sources_used.append(f"YouTube (sous-titres) : {youtube_url}")
        else:
            transcription = f"[Vidéo YouTube sans sous-titres exploitables : {youtube_url}]"
            sources_used.append(f"YouTube : {youtube_url}")

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


@router.post("/pdf-to-course", response_model=GeneratedCourseBlocks)
async def pdf_to_course(
    file: UploadFile = File(...),
    title: str = Form(...),
    level: str = Form(default="intermediate"),
    language: str = Form(default="fr"),
    n_sections: int = Form(default=5, ge=2, le=12),
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """
    Pipeline PDF → Cours en BLOCS structurés (boosté par le provider LLM configuré, ex. Mistral).
    Extraction texte (pdfplumber) ; si le PDF est en images (peu/pas de texte) → repli OCR Mistral.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Fichier PDF (.pdf) requis")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF trop volumineux (max 25 Mo)")

    sources = [f"PDF : {file.filename}"]
    try:
        extracted = extract_pdf_text(pdf_bytes) or ""
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Impossible de lire le PDF : {e}")

    # Repli OCR : PDF-image (slides, scan) → peu de texte extrait par pdfplumber.
    if len(extracted.strip()) < 200:
        ocr_text = ocr_pdf_mistral(pdf_bytes)
        if ocr_text.strip():
            extracted = ocr_text
            sources.append("OCR Mistral")

    if not extracted.strip():
        raise HTTPException(
            status_code=422,
            detail="Aucun texte exploitable extrait (PDF image + OCR indisponible : vérifie MISTRAL_API_KEY).",
        )

    MAX_CHARS = 60_000
    total_chars = len(extracted)
    if total_chars > MAX_CHARS:
        pct = round(MAX_CHARS / total_chars * 100)
        logger.info("PDF %s tronqué : %d -> %d chars (%d%%)", file.filename, total_chars, MAX_CHARS, pct)
        extracted = extracted[:MAX_CHARS]
        sources.append(f"⚠️ PDF tronqué : {pct}% du texte utilisé ({MAX_CHARS} / {total_chars} caractères)")

    try:
        data = await generate_course_blocks_from_content(
            transcription="",
            slides_content=extracted,
            title=title,
            level=level,
            language=language,
            n_sections=n_sections,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return GeneratedCourseBlocks(
        title=data["title"],
        blocks=[GeneratedBlock(**b) for b in data["blocks"]],
        level=level,
        language=language,
        sources_used=sources,
    )


@router.post("/save-course")
def save_course(
    body: SaveCourseRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
    db: Session = Depends(get_db),
):
    """
    Persiste un cours généré en base (Supabase Postgres) : une ligne `Course` publiée
    + un bloc markdown contenant le contenu. Renvoie l'id réel du cours créé.
    """
    import uuid

    if not body.title.strip():
        raise HTTPException(status_code=400, detail="Titre requis")
    if not body.blocks and not (body.content and body.content.strip()):
        raise HTTPException(status_code=400, detail="Contenu requis (blocs ou markdown)")

    access = body.access_level if body.access_level in ("public", "hiparis", "cohort") else "public"
    level = body.level if body.level in ("beginner", "intermediate", "advanced") else "intermediate"

    # Description courte : 1er bloc texte, ou 1re ligne non-titre du markdown.
    desc = None
    if body.blocks:
        for b in body.blocks:
            if b.get("type") == "text":
                d = (b.get("content") or {}).get("content")
                if isinstance(d, str) and d.strip():
                    desc = d.strip()
                    break
    elif body.content:
        desc = next(
            (l.strip() for l in body.content.split("\n") if l.strip() and not l.strip().startswith("#")),
            None,
        )
    if desc and len(desc) > 240:
        desc = desc[:240].rstrip() + "…"

    course = Course(
        id=str(uuid.uuid4()),
        title=body.title.strip(),
        description=desc,
        category=body.category,
        tags=json.dumps([body.category] if body.category else []),
        level=level,
        school=body.school,
        status="published",
        access_level=access,
        estimated_duration_minutes=0,
        created_by=current_user.id,
    )
    db.add(course)
    db.flush()  # garantit la ligne course avant les blocs (FK course_id)

    valid_types = {"heading", "text", "markdown", "quiz", "code", "video", "image", "divider"}
    if body.blocks:
        for i, blk in enumerate(body.blocks):
            btype = blk.get("type") if blk.get("type") in valid_types else "text"
            content = blk.get("content") if isinstance(blk.get("content"), dict) else {}
            db.add(CourseBlock(id=str(uuid.uuid4()), course_id=course.id, position=i, type=btype, content=content))
    else:
        db.add(CourseBlock(
            id=str(uuid.uuid4()), course_id=course.id, position=0,
            type="markdown", content={"content": body.content},
        ))

    log_action(db, current_user.id, "course_create", "course", course.id,
               {"title": course.title, "access_level": access, "source": "studio"})
    db.commit()
    db.refresh(course)
    return {"message": "Cours enregistré", "course_id": course.id, "title": course.title}


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


# ── Pipeline 4 : Contenu → Carte mentale (Phase 11) ──────────────────────────

# Note : pas de `response_model` ici — le modèle MindMapNode est récursif et
# certaines versions de FastAPI peinent à en générer le schéma au démarrage.
# On valide quand même la sortie en construisant GeneratedMindMap (Pydantic pur).
@router.post("/mindmap")
async def content_to_mindmap(
    body: GenerateFromTextRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Génère une carte mentale hiérarchique à partir d'un contenu de cours."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Contenu requis")
    try:
        data = await generate_mindmap_from_content(
            content=body.content,
            language=body.language,
            title=body.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return GeneratedMindMap(**data)


# ── Pipeline 5 : Contenu → Fiche de révision (Phase 11) ──────────────────────

@router.post("/study-sheet", response_model=GeneratedStudySheet)
async def content_to_study_sheet(
    body: GenerateFromTextRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Génère une fiche de révision structurée à partir d'un contenu de cours."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Contenu requis")
    try:
        data = await generate_study_sheet_from_content(
            content=body.content,
            language=body.language,
            title=body.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return GeneratedStudySheet(**data)


# ── Pipeline 6 : Contenu → FAQ (Phase 11) ────────────────────────────────────

@router.post("/faq", response_model=GeneratedFAQ)
async def content_to_faq(
    body: FAQRequest,
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """Génère une FAQ à partir d'un contenu de cours."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Contenu requis")
    try:
        data = await generate_faq_from_content(
            content=body.content,
            n_items=body.n_items,
            language=body.language,
            title=body.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return GeneratedFAQ(**data)


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
        "transcription_configured": bool(settings.MISTRAL_API_KEY or settings.OPENAI_API_KEY),
        "transcription_provider": "mistral" if settings.MISTRAL_API_KEY else ("openai" if settings.OPENAI_API_KEY else None),
        "pipelines": ["excel-to-quiz", "video-to-course", "pdf-to-course", "flashcards", "mindmap", "study-sheet", "faq"],
    }
