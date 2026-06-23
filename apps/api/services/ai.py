"""
Service IA — Studio.
Génère quiz et cours via la couche LLM-agnostique (services/llm.py).
Si aucun provider LLM n'est configuré, retourne un contenu de démonstration.
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


DEMO_COURSE = """# Introduction au Machine Learning

## Objectifs pédagogiques
- Comprendre les fondements du machine learning
- Distinguer apprentissage supervisé et non-supervisé
- Maîtriser les métriques d'évaluation essentielles
- Appliquer les bonnes pratiques de validation

## Section 1 : Qu'est-ce que le Machine Learning ?

Le machine learning est un sous-domaine de l'intelligence artificielle qui permet aux systèmes informatiques d'apprendre automatiquement à partir de données, sans être explicitement programmés pour chaque tâche.

> **Point clé** : Un modèle ML apprend des patterns dans les données d'entraînement pour généraliser à de nouvelles données inconnues.

Contrairement à la programmation classique où les règles sont écrites manuellement, le ML extrait ces règles directement depuis les exemples. Cette approche est particulièrement puissante pour des problèmes où les règles sont trop complexes à formaliser.

## Section 2 : Types d'apprentissage

**Apprentissage supervisé** : Le modèle apprend depuis des données étiquetées (paires entrée/sortie). Exemples : classification d'images, prédiction de prix.

**Apprentissage non-supervisé** : Le modèle découvre des structures cachées dans des données non étiquetées. Exemples : clustering, réduction de dimension.

**Apprentissage par renforcement** : Un agent apprend en interagissant avec un environnement et en recevant des récompenses ou pénalités.

## Section 3 : Évaluation des modèles

L'évaluation est cruciale pour mesurer la qualité d'un modèle et éviter le surapprentissage.

```python
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, predictions):.3f}")
print(f"F1-score: {f1_score(y_test, predictions, average='weighted'):.3f}")
```

> **Point clé** : Utilisez toujours un jeu de test séparé pour l'évaluation finale. Ne touchez jamais aux données de test pendant l'entraînement.

## Quiz de validation

**Question 1** : Quel type d'apprentissage utilise des données étiquetées ?
- [x] Supervisé (correct)
- [ ] Non-supervisé
- [ ] Par renforcement
- [ ] Semi-supervisé

*Explication : L'apprentissage supervisé nécessite des paires (entrée, étiquette) pour entraîner le modèle.*

**Question 2** : Quelle métrique est la plus adaptée aux classes déséquilibrées ?
- [ ] Accuracy
- [x] F1-score (correct)
- [ ] MSE
- [ ] R²

*Explication : Le F1-score combine précision et rappel, ce qui le rend robuste aux déséquilibres de classes.*

## Résumé

Le machine learning repose sur trois piliers fondamentaux : les **données** (qualité et quantité), les **algorithmes** (choix du modèle adapté) et l'**évaluation** (mesurer la généralisation). Maîtriser ces trois aspects est indispensable pour développer des systèmes ML fiables.

## Ressources complémentaires
- Scikit-learn documentation : https://scikit-learn.org
- Cours Andrew Ng (Coursera) : Machine Learning Specialization
- Livre : "Hands-On Machine Learning" — Aurélien Géron
"""


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
        logger.warning("Aucun provider LLM configuré — retour cours de démo")
        return DEMO_COURSE

    try:
        prompt = _build_course_prompt(transcription, slides_content, title, level, language, n_sections)
        return provider.complete(prompt, max_tokens=8192)

    except Exception as e:
        logger.error("Erreur LLM (course): %s", e)
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
        logger.warning("Aucun provider LLM configuré — retour quiz de démo")
        demo = DEMO_QUIZ.copy()
        demo["questions"] = demo["questions"][:n_questions]
        if quiz_title:
            demo["quiz_title"] = quiz_title
        return demo

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

DEMO_FLASHCARDS = {
    "title": "Flashcards de démonstration",
    "language": "fr",
    "cards": [
        {"id": 1, "front": "Apprentissage supervisé", "back": "Paradigme où le modèle apprend à partir d'exemples étiquetés (paires entrée/sortie)."},
        {"id": 2, "front": "Surapprentissage (overfitting)", "back": "Quand un modèle colle trop aux données d'entraînement et généralise mal aux nouvelles données."},
        {"id": 3, "front": "F1-score", "back": "Moyenne harmonique de la précision et du rappel ; adapté aux classes déséquilibrées."},
        {"id": 4, "front": "Régularisation L2 (Ridge)", "back": "Pénalité sur la somme des carrés des poids pour réduire le surapprentissage."},
        {"id": 5, "front": "Validation croisée", "back": "Découpe les données en plusieurs plis pour estimer la performance de façon robuste."},
    ],
}


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
        logger.warning("Aucun provider LLM configuré — retour flashcards de démo")
        demo = DEMO_FLASHCARDS.copy()
        demo["cards"] = demo["cards"][:n_cards]
        if title:
            demo["title"] = title
        return demo

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

DEMO_MINDMAP = {
    "title": "Carte mentale de démonstration",
    "root": {
        "label": "Machine Learning",
        "children": [
            {"label": "Types d'apprentissage", "children": [
                {"label": "Supervisé", "children": []},
                {"label": "Non-supervisé", "children": []},
                {"label": "Par renforcement", "children": []},
            ]},
            {"label": "Évaluation", "children": [
                {"label": "Accuracy", "children": []},
                {"label": "F1-score", "children": []},
                {"label": "Validation croisée", "children": []},
            ]},
            {"label": "Surapprentissage", "children": [
                {"label": "Régularisation L1/L2", "children": []},
                {"label": "Jeu de test séparé", "children": []},
            ]},
        ],
    },
}


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
        logger.warning("Aucun provider LLM configuré — retour carte mentale de démo")
        demo = DEMO_MINDMAP.copy()
        if title:
            demo["title"] = title
        return demo

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

DEMO_STUDY_SHEET = {
    "title": "Fiche de révision de démonstration",
    "language": "fr",
    "summary": "Le machine learning permet aux systèmes d'apprendre à partir de données. On distingue l'apprentissage supervisé, non-supervisé et par renforcement. L'évaluation rigoureuse et la lutte contre le surapprentissage sont essentielles.",
    "key_concepts": [
        {"term": "Apprentissage supervisé", "definition": "Le modèle apprend depuis des données étiquetées (paires entrée/sortie)."},
        {"term": "Surapprentissage", "definition": "Le modèle mémorise les données d'entraînement et généralise mal."},
        {"term": "F1-score", "definition": "Moyenne harmonique précision/rappel, adaptée aux classes déséquilibrées."},
    ],
    "key_points": [
        "Toujours évaluer sur un jeu de test séparé.",
        "Choisir la métrique selon le problème (ex. F1 si classes déséquilibrées).",
        "La régularisation réduit le surapprentissage.",
    ],
}


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
        logger.warning("Aucun provider LLM configuré — retour fiche de révision de démo")
        demo = DEMO_STUDY_SHEET.copy()
        if title:
            demo["title"] = title
        return demo

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
