"""
Claude API service — Studio IA.
Si ANTHROPIC_API_KEY n'est pas configuré, retourne un quiz de démo.
"""
import json
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

DEMO_QUIZ = {
    "quiz_title": "Quiz de démonstration",
    "difficulty": "intermédiaire",
    "language": "fr",
    "questions": [
        {
            "id": 1,
            "question": "Qu'est-ce que l'apprentissage supervisé ?",
            "options": [
                "A. Un algorithme d'optimisation",
                "B. Un paradigme où le modèle apprend à partir d'exemples étiquetés",
                "C. Une méthode de clustering",
                "D. Un type de réseau de neurones"
            ],
            "correct": "B",
            "explanation": "L'apprentissage supervisé consiste à entraîner un modèle sur des données associées à des labels connus, afin qu'il puisse prédire les labels de nouvelles données.",
            "difficulty": "facile",
            "source_row": 1
        },
        {
            "id": 2,
            "question": "Quelle métrique est appropriée pour un problème de classification déséquilibré ?",
            "options": [
                "A. L'accuracy",
                "B. Le F1-score",
                "C. La variance",
                "D. Le coefficient de détermination R²"
            ],
            "correct": "B",
            "explanation": "Le F1-score combine précision et rappel, ce qui le rend plus pertinent que l'accuracy sur des classes déséquilibrées.",
            "difficulty": "intermédiaire",
            "source_row": 2
        },
        {
            "id": 3,
            "question": "Qu'est-ce que la régularisation L2 (Ridge) ?",
            "options": [
                "A. Une technique d'augmentation des données",
                "B. Une pénalité sur la somme des valeurs absolues des paramètres",
                "C. Une pénalité sur la somme des carrés des paramètres",
                "D. Une méthode d'initialisation des poids"
            ],
            "correct": "C",
            "explanation": "La régularisation L2 ajoute une pénalité proportionnelle à la somme des carrés des poids, ce qui encourage des poids plus petits et réduit le surapprentissage.",
            "difficulty": "intermédiaire",
            "source_row": 3
        }
    ]
}


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


async def generate_quiz_from_content(
    content: str,
    n_questions: int = 5,
    difficulty: str = "intermédiaire",
    language: str = "fr",
    quiz_title: Optional[str] = None,
) -> dict:
    """Appelle Claude pour générer un quiz. Fallback sur démo si pas d'API key."""

    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY non configuré — retour quiz de démo")
        demo = DEMO_QUIZ.copy()
        demo["questions"] = demo["questions"][:n_questions]
        if quiz_title:
            demo["quiz_title"] = quiz_title
        return demo

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        prompt = _build_prompt(content, n_questions, difficulty, language)

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()

        # Nettoyer si le LLM a ajouté des backticks malgré les instructions
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)
        if quiz_title and not result.get("quiz_title"):
            result["quiz_title"] = quiz_title
        return result

    except json.JSONDecodeError as e:
        logger.error("JSON invalide retourné par Claude: %s", e)
        raise ValueError("Le modèle IA n'a pas retourné un JSON valide. Réessayez.")
    except Exception as e:
        logger.error("Erreur Claude API: %s", e)
        raise ValueError(f"Erreur lors de la génération: {str(e)}")
