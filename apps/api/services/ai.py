"""
Service IA — Studio.
Génère quiz et cours via la couche LLM-agnostique (services/llm.py).
Si aucun provider LLM n'est configuré, une erreur est levée (plus de contenu de démonstration).
"""
import json
import logging
from typing import Optional

from services.llm import get_llm_provider

logger = logging.getLogger(__name__)


def _strip_code_fences(raw: str) -> str:
    """Retire les backticks ```/```json qu'un LLM ajoute parfois autour du JSON."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


def _build_prompt(content: str, n_questions: int, difficulty: str, language: str) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    return f"""Tu es un expert en création de contenu pédagogique. À partir des données suivantes extraites d'un fichier Excel, génère exactement {n_questions} questions de quiz de niveau {difficulty} en {lang_label}.

DONNÉES SOURCE :
{content}

INSTRUCTIONS :
- Génère exactement {n_questions} questions à choix multiple (4 options)
- Niveau de difficulté : {difficulty}
- Langue : {lang_label}
- Chaque question doit avoir exactement 4 options (A, B, C, D)
- Une seule bonne réponse par question
- L'explication doit être pédagogique et concise (1-2 phrases)
- Varie les formats de questions (définitions, applications, comparaisons)

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans commentaires :
{{
  "quiz_title": "titre du quiz",
  "difficulty": "{difficulty}",
  "language": "{language}",
  "questions": [
    {{
      "id": 1,
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": "A",
      "explanation": "...",
      "difficulty": "{difficulty}",
      "source_row": 1
    }}
  ]
}}"""


def _build_course_prompt(
    transcription: str,
    slides_content: str,
    title: str,
    level: str,
    language: str,
    n_sections: int,
) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    level_label = {"beginner": "débutant", "intermediate": "intermédiaire", "advanced": "avancé"}.get(level, level)

    sources = []
    if transcription:
        sources.append(f"TRANSCRIPTION VIDÉO:\n{transcription[:4000]}")
    if slides_content:
        sources.append(f"CONTENU DES SLIDES:\n{slides_content[:2000]}")

    return f"""Tu es un expert en création de contenu pédagogique. Génère un cours complet et structuré en Markdown à partir des sources suivantes.

{'=' * 60}
{chr(10).join(sources) if sources else "Génère un cours de démonstration sur les fondamentaux de l'IA."}
{'=' * 60}

PARAMÈTRES:
- Titre : {title}
- Niveau : {level_label}
- Langue : {lang_label}
- Nombre de sections : {n_sections}

STRUCTURE OBLIGATOIRE (respecte exactement) :
# [Titre du cours]

## Objectifs pédagogiques
- [3-4 objectifs]

## Section 1 : [Titre]
[150-250 mots de contenu synthétisé depuis les sources]
> **Point clé** : [insight important]
[exemple de code si pertinent en bloc ```]

## Section 2 : [Titre]
[idem]

[... {n_sections} sections au total ...]

## Quiz de validation
[3-4 questions QCM au format :]
**Question N** : [question]
- [x] [bonne réponse] (correct)
- [ ] [mauvaise réponse]
- [ ] [mauvaise réponse]
- [ ] [mauvaise réponse]
*Explication : [explication pédagogique]*

## Résumé
[100-150 mots récapitulatifs]

## Ressources complémentaires
- [3-4 ressources pertinentes]

CONTRAINTES :
- Réponds UNIQUEMENT avec le Markdown, sans commentaires ni backticks englobants
- Synthétise fidèlement le contenu des sources
- Adopte un ton {level_label} approprié
- Langue : {lang_label} uniquement"""


async def generate_course_from_content(
    transcription: str = "",
    slides_content: str = "",
    title: str = "Cours généré par IA",
    level: str = "intermediate",
    language: str = "fr",
    n_sections: int = 4,
) -> str:
    """
    Génère un cours Markdown complet depuis transcription + slides via le LLM configuré.
    Fallback sur démo si aucun provider LLM n'est configuré.
    """
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_course_prompt(transcription, slides_content, title, level, language, n_sections)
        return provider.complete(prompt, max_tokens=8192)

    except Exception as e:
        logger.error("Erreur LLM (course): %s", e)
        raise ValueError(f"Erreur lors de la génération du cours: {e}")


# ── Cours en blocs structurés (JSON) ─────────────────────────────────────────

# Types de blocs supportés par le rendu (CoursePageClient). "code" → utiliser "markdown".
_VALID_BLOCK_TYPES = {"heading", "text", "markdown", "quiz", "divider"}

def _build_course_blocks_prompt(transcription: str, slides_content: str, title: str, level: str, language: str, n_sections: int) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    level_label = {"beginner": "débutant", "intermediate": "intermédiaire", "advanced": "avancé"}.get(level, level)
    sources = []
    if transcription:
        sources.append(f"TRANSCRIPTION:\n{transcription[:4000]}")
    if slides_content:
        sources.append(f"CONTENU:\n{slides_content[:6000]}")

    return f"""Tu es un expert en création de contenu pédagogique. Génère un cours structuré en BLOCS à partir des sources.

{'=' * 60}
{chr(10).join(sources) if sources else "Génère un cours de démonstration sur les fondamentaux de l'IA."}
{'=' * 60}

PARAMÈTRES : titre « {title} » · niveau {level_label} · langue {lang_label} · environ {n_sections} sections.

TYPES DE BLOCS AUTORISÉS :
- "heading" : titre de section        → content: {{"content": "..."}}
- "text"    : paragraphe pédagogique  → content: {{"content": "..."}}
- "markdown": code ou contenu riche   → content: {{"content": "```python\\n...\\n```"}}
- "quiz"    : QCM 4 options            → content: {{"question": "...", "options": ["..","..","..",".."], "answer": 0, "explanation": ".."}}

RÈGLES (viser une forte densité pédagogique) :
- Alterne "heading" puis "text" pour chaque section (~{n_sections} sections).
- Ajoute GÉNÉREUSEMENT du CODE : au moins un bloc "markdown" avec un exemple ```lang ...``` par section technique.
- Ajoute PLUSIEURS blocs "quiz" — idéalement un après chaque section clé (~{n_sections} au total). "answer" = index (0-based) de la bonne option.
- Si les sources contiennent des figures / schémas / captures de slides, signale-les par un bloc "markdown" du type "> 📊 **Figure** : [légende descriptive]".
- Synthétise fidèlement les sources. Ton {level_label}. Langue : {lang_label} uniquement.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni backticks englobants :
{{
  "title": "{title}",
  "blocks": [
    {{"type": "heading", "content": {{"content": "..."}}}},
    {{"type": "text", "content": {{"content": "..."}}}},
    {{"type": "quiz", "content": {{"question": "...", "options": ["..","..","..",".."], "answer": 0, "explanation": ".."}}}}
  ]
}}"""


def _normalize_blocks(raw_blocks: list) -> list:
    """Garde uniquement les blocs bien formés (type valide + content dict)."""
    clean = []
    for b in raw_blocks or []:
        if not isinstance(b, dict):
            continue
        btype = b.get("type")
        content = b.get("content")
        if btype in _VALID_BLOCK_TYPES and isinstance(content, dict):
            clean.append({"type": btype, "content": content})
    return clean


async def generate_course_blocks_from_content(
    transcription: str = "",
    slides_content: str = "",
    title: str = "Cours généré par IA",
    level: str = "intermediate",
    language: str = "fr",
    n_sections: int = 4,
) -> dict:
    """
    Génère un cours en blocs structurés (heading/text/markdown/quiz) via le LLM configuré.
    Fallback sur démo si aucun provider LLM n'est configuré.
    """
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_course_blocks_prompt(transcription, slides_content, title, level, language, n_sections)
        raw = _strip_code_fences(provider.complete(prompt, max_tokens=8192))
        result = json.loads(raw)
        blocks = _normalize_blocks(result.get("blocks", []))
        if not blocks:
            raise ValueError("Le modèle n'a pas retourné de blocs exploitables.")
        return {"title": result.get("title") or title, "blocks": blocks}
    except json.JSONDecodeError:
        logger.error("JSON invalide retourné par le LLM (course blocks)")
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except ValueError:
        raise
    except Exception as e:
        logger.error("Erreur LLM (course blocks): %s", e)
        raise ValueError(f"Erreur lors de la génération du cours: {e}")


async def generate_quiz_from_content(
    content: str,
    n_questions: int = 5,
    difficulty: str = "intermédiaire",
    language: str = "fr",
    quiz_title: Optional[str] = None,
) -> dict:
    """Appelle Claude pour générer un quiz. Fallback sur démo si pas d'API key."""

    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_prompt(content, n_questions, difficulty, language)

        raw = _strip_code_fences(provider.complete(prompt, max_tokens=4096))

        result = json.loads(raw)
        if quiz_title and not result.get("quiz_title"):
            result["quiz_title"] = quiz_title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par le LLM: %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur LLM (quiz): %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")


# ── Flashcards (Phase 11) ─────────────────────────────────────────────────────

def _build_flashcards_prompt(content: str, n_cards: int, language: str) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    return f"""Tu es un expert en pédagogie. À partir du contenu de cours suivant, génère exactement {n_cards} flashcards de révision en {lang_label}.

CONTENU SOURCE :
{content[:6000]}

INSTRUCTIONS :
- Chaque flashcard a un recto (terme, concept ou question courte) et un verso (définition ou réponse concise, 1-2 phrases).
- Couvre les notions les plus importantes du contenu, sans redondance.
- Reste fidèle au contenu source.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown :
{{
  "title": "titre des flashcards",
  "language": "{language}",
  "cards": [
    {{ "id": 1, "front": "...", "back": "..." }}
  ]
}}"""


async def generate_flashcards_from_content(
    content: str,
    n_cards: int = 10,
    language: str = "fr",
    title: Optional[str] = None,
) -> dict:
    """Génère des flashcards depuis un contenu de cours via le LLM configuré.
    Fallback sur démo si aucun provider LLM n'est configuré."""
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_flashcards_prompt(content, n_cards, language)
        raw = _strip_code_fences(provider.complete(prompt, max_tokens=4096))
        result = json.loads(raw)
        if title and not result.get("title"):
            result["title"] = title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par le LLM (flashcards): %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur LLM (flashcards): %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")


# ── Carte mentale (NotebookLM-style, Phase 11) ────────────────────────────────

def _build_mindmap_prompt(content: str, language: str) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    return f"""Tu es un expert en pédagogie. À partir du contenu de cours suivant, construis une carte mentale hiérarchique en {lang_label}.

CONTENU SOURCE :
{content[:6000]}

INSTRUCTIONS :
- Un concept central (racine), puis 3 à 6 branches principales, chacune avec 2 à 5 sous-nœuds.
- Profondeur maximale : 3 niveaux. Labels courts (1 à 5 mots).
- Reste fidèle au contenu source ; structure logiquement les notions.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown. Chaque nœud a "label" et "children" (liste, éventuellement vide) :
{{
  "title": "titre de la carte",
  "root": {{
    "label": "Concept central",
    "children": [
      {{ "label": "Branche", "children": [ {{ "label": "Sous-point", "children": [] }} ] }}
    ]
  }}
}}"""


async def generate_mindmap_from_content(
    content: str,
    language: str = "fr",
    title: Optional[str] = None,
) -> dict:
    """Génère une carte mentale hiérarchique depuis un contenu de cours.
    Fallback sur démo si aucun provider LLM n'est configuré."""
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_mindmap_prompt(content, language)
        raw = _strip_code_fences(provider.complete(prompt, max_tokens=4096))
        result = json.loads(raw)
        if title and not result.get("title"):
            result["title"] = title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par le LLM (mindmap): %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur LLM (mindmap): %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")


# ── Fiche de révision (NotebookLM-style, Phase 11) ────────────────────────────

def _build_study_sheet_prompt(content: str, language: str) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    return f"""Tu es un expert en pédagogie. À partir du contenu de cours suivant, rédige une fiche de révision synthétique en {lang_label}.

CONTENU SOURCE :
{content[:6000]}

INSTRUCTIONS :
- Un résumé de 3 à 5 phrases.
- 3 à 8 concepts clés (terme + définition concise).
- 3 à 6 points à retenir (phrases courtes et actionnables).
- Reste fidèle au contenu source.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown :
{{
  "title": "titre de la fiche",
  "language": "{language}",
  "summary": "...",
  "key_concepts": [ {{ "term": "...", "definition": "..." }} ],
  "key_points": [ "..." ]
}}"""


async def generate_study_sheet_from_content(
    content: str,
    language: str = "fr",
    title: Optional[str] = None,
) -> dict:
    """Génère une fiche de révision structurée depuis un contenu de cours.
    Fallback sur démo si aucun provider LLM n'est configuré."""
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_study_sheet_prompt(content, language)
        raw = _strip_code_fences(provider.complete(prompt, max_tokens=4096))
        result = json.loads(raw)
        if title and not result.get("title"):
            result["title"] = title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par le LLM (study-sheet): %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur LLM (study-sheet): %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")


# ── FAQ (NotebookLM-style, Phase 11) ──────────────────────────────────────────

def _build_faq_prompt(content: str, n_items: int, language: str) -> str:
    lang_label = "français" if language == "fr" else "anglais"
    return f"""Tu es un expert en pédagogie. À partir du contenu de cours suivant, génère une FAQ de {n_items} questions-réponses en {lang_label}.

CONTENU SOURCE :
{content[:6000]}

INSTRUCTIONS :
- Anticipe les questions que se posent réellement les apprenants.
- Réponses concises (1 à 3 phrases), fidèles au contenu source.
- Évite les redondances.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown :
{{
  "title": "titre de la FAQ",
  "language": "{language}",
  "items": [ {{ "question": "...", "answer": "..." }} ]
}}"""


async def generate_faq_from_content(
    content: str,
    n_items: int = 6,
    language: str = "fr",
    title: Optional[str] = None,
) -> dict:
    """Génère une FAQ depuis un contenu de cours.
    Fallback sur démo si aucun provider LLM n'est configuré."""
    provider = get_llm_provider()
    if provider is None:
        raise ValueError("Aucun fournisseur LLM configuré. Renseigne MISTRAL_API_KEY (ou un autre provider).")

    try:
        prompt = _build_faq_prompt(content, n_items, language)
        raw = _strip_code_fences(provider.complete(prompt, max_tokens=4096))
        result = json.loads(raw)
        if title and not result.get("title"):
            result["title"] = title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par le LLM (faq): %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur LLM (faq): %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")
