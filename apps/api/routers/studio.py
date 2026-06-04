"""
Studio IA — Pipelines de génération de contenu.
Phase 3 : Excel → Quiz
Phase 4 : Vidéo + Slides → Cours (à venir)
"""
import io
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from core.deps import require_role
from core.store import CurrentUser
from services.ai import generate_quiz_from_content

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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_excel_content(file_bytes: bytes) -> str:
    """Parse le fichier Excel et retourne son contenu sous forme de texte structuré."""
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

        # Ignore empty rows
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

        if i > 200:  # Limite pour le prompt
            lines.append(f"... (fichier tronqué à 200 lignes)")
            break

    wb.close()
    return "\n".join(lines)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/excel-to-quiz", response_model=GeneratedQuiz)
async def excel_to_quiz(
    file: UploadFile = File(...),
    n_questions: int = Form(default=5, ge=1, le=20),
    difficulty: str = Form(default="intermédiaire"),
    language: str = Form(default="fr"),
    quiz_title: Optional[str] = Form(default=None),
    current_user: CurrentUser = Depends(require_role(*TEACHER_ROLES)),
):
    """
    Pipeline 1 — Excel → Quiz.
    Upload un .xlsx, extrait le contenu, appelle Claude, retourne le quiz structuré.
    """
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
    """
    Sauvegarde un quiz généré dans un cours existant.
    Pour l'instant : stockage en mémoire dans le store global.
    """
    from core.store import store

    # On ajoute le quiz comme blocs dans la mémoire locale (pas de DB encore)
    # Quand la DB sera là, ce sera inséré dans course_blocks
    quiz_data = body.quiz.model_dump()
    store.update(current_user.id, {
        f"draft_quiz_{body.course_id}": json.dumps(quiz_data),
    })

    return {
        "message": "Quiz sauvegardé avec succès",
        "course_id": body.course_id,
        "questions_count": len(body.quiz.questions),
    }


@router.get("/health")
def studio_health():
    from core.config import settings
    return {
        "studio": "ok",
        "ai_configured": bool(settings.ANTHROPIC_API_KEY),
        "pipelines": ["excel-to-quiz"],
    }
