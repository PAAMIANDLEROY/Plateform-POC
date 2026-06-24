"""Seed demo videos, MOOCs and apps

Complète la migration 0006 (cours) : sur une base fraîche, les pages Hi! Tube,
Hi! MOOC et Hi! App sont vides. On seede les mêmes ids que le front (mock) pour
que les listes et les pages de détail fonctionnent.

Idempotent par entité (skip si la vidéo/mooc/app "1" existe déjà).
Les MOOCs référencent les cours seedés en 0006 (ids 1..11).

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-24
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
from sqlalchemy.orm import Session

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEMO_TEACHER_ID = "11111111-1111-1111-1111-111111111111"
DEMO_TEACHER_EMAIL = "contenu.demo@ip-paris.fr"

# (id, titre, youtube_id, description, catégorie, école, tags, durée "mm:ss"|"h:mm:ss", vues, thumbnail)
VIDEOS = [
    ("1", "Introduction au Machine Learning", "aircAruvnKk", "Découvrez les fondements du machine learning : régression, classification et évaluation de modèles.", "IA & Data", "Polytechnique", ["Machine Learning", "Scikit-learn", "Débutant"], "42:18", 1240, "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&h=450&q=80"),
    ("2", "Deep Learning avec PyTorch", "IHZwWFHWa-w", "Implémentation complète de réseaux de neurones profonds avec PyTorch : rétropropagation, CNNs, RNNs.", "IA & Data", "Télécom Paris", ["Deep Learning", "PyTorch", "CNN", "Avancé"], "1:12:05", 890, "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&h=450&q=80"),
    ("3", "Statistiques bayésiennes", "aircAruvnKk", "Théorème de Bayes, distributions a priori/a posteriori, inférence variationnelle et MCMC.", "Mathématiques", "ENSAE", ["Statistiques", "Probabilités", "MCMC", "Intermédiaire"], "55:30", 654, "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80"),
    ("4", "Optimisation convexe", "aircAruvnKk", "Bases mathématiques de l'optimisation convexe : conditions KKT, descente de gradient, méthodes proximales.", "Mathématiques", "Polytechnique", ["Optimisation", "Gradient", "Convexité", "Avancé"], "38:44", 412, "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&h=450&q=80"),
    ("5", "NLP : Transformers de A à Z", "aircAruvnKk", "Du mécanisme d'attention à BERT et GPT : architecture Transformer complète, fine-tuning et production.", "IA & Data", "Télécom Paris", ["NLP", "Transformers", "BERT", "Avancé"], "1:28:10", 2100, "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=450&q=80"),
    ("6", "Finance quantitative", "aircAruvnKk", "Pricing d'options (Black-Scholes), gestion des risques et modélisation stochastique des marchés.", "Finance", "HEC", ["Finance", "Options", "Risk Management", "Intermédiaire"], "49:22", 780, "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&h=450&q=80"),
    ("7", "Reinforcement Learning : des bases à AlphaGo", "aircAruvnKk", "Du Q-Learning aux Policy Gradients, les algorithmes derrière AlphaGo et le RLHF de ChatGPT.", "IA & Data", "Polytechnique", ["Reinforcement Learning", "Q-Learning", "Avancé"], "1:05:40", 1560, "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&h=450&q=80"),
    ("8", "Computer Vision & Détection d'objets", "aircAruvnKk", "Détection et segmentation d'objets avec YOLO, Mask R-CNN et SAM. Applications concrètes.", "IA & Data", "Télécom Paris", ["Computer Vision", "YOLO", "CNN", "Intermédiaire"], "58:12", 1840, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=450&q=80"),
    ("9", "LLMs : fine-tuning et RLHF", "aircAruvnKk", "Fine-tuning efficace de LLMs : LoRA, QLoRA, RLHF, DPO. De la théorie à la production GPU cloud.", "IA & Data", "Polytechnique", ["LLM", "RLHF", "LoRA", "Avancé"], "1:35:00", 3200, "https://images.unsplash.com/photo-1686191128892-3b37add4c844?auto=format&fit=crop&w=800&h=450&q=80"),
]

# (id, titre, description, url, tags, école)
APPS = [
    ("1", "Playground ML", "Entraîne et visualise des modèles interactivement.", "https://playground.tensorflow.org", ["ML", "Visualisation"], "Polytechnique"),
    ("2", "Explorateur de datasets", "Analyse statistique et visualisation de jeux de données CSV.", "https://github.com/simonw/datasette", ["Data", "Statistiques"], "ENSAE"),
    ("3", "NLP Demo", "Testez des modèles de traitement du langage naturel.", "https://huggingface.co/spaces", ["NLP", "Transformers"], "Télécom Paris"),
    ("4", "Chatbot RAG", "Posez des questions sur vos documents grâce à un chatbot RAG.", "https://github.com/langchain-ai/langchain", ["RAG", "NLP", "Génération"], "Télécom Paris"),
    ("5", "Classifieur CNN Interactif", "Entraînez et évaluez un CNN sur vos propres images dans le navigateur.", "https://github.com/googlecreativelab/teachablemachine-community", ["CNN", "Computer Vision", "Classification"], "Polytechnique"),
    ("6", "Générateur d'images IA", "Générez des images à partir d'une description avec Stable Diffusion.", "https://github.com/AUTOMATIC1111/stable-diffusion-webui", ["Diffusion", "Génération", "Multimodal"], "ENSAE"),
    ("7", "Détecteur d'anomalies", "Identifiez des valeurs aberrantes avec des algorithmes non-supervisés.", "https://playground.tensorflow.org", ["Anomaly Detection", "Non-supervisé", "Data"], "ENSAE"),
    ("8", "Visualiseur d'embeddings", "Explorez les espaces vectoriels de vos modèles NLP (t-SNE, UMAP).", "https://github.com/tensorflow/embedding-projector-standalone", ["Embeddings", "NLP", "Visualisation"], "Polytechnique"),
]

# (id, titre, description, école, [(titre_module, [course_ids])])
MOOCS = [
    ("1", "Parcours Data Scientist", "De Python aux modèles en production.", "Polytechnique", [
        ("Fondations", ["1", "2"]),
        ("Modèles avancés", ["3", "7"]),
    ]),
    ("2", "IA pour les managers", "Comprendre l'IA sans coder. Idéal pour les décideurs.", "HEC", [
        ("Comprendre l'IA", ["1"]),
        ("Enjeux & éthique", ["10"]),
    ]),
    ("3", "MLOps & mise en production", "Déployer et monitorer des modèles ML en entreprise.", "Télécom Paris", [
        ("Bases du déploiement", ["2"]),
        ("Industrialisation", ["6"]),
    ]),
]


def _dur_to_seconds(s: str) -> int:
    """'42:18' -> 2538 ; '1:12:05' -> 4325."""
    total = 0
    for part in s.split(":"):
        total = total * 60 + int(part)
    return total


def _get_demo_teacher(session, User, UserRole):
    teacher = session.get(User, DEMO_TEACHER_ID)
    if teacher is None:
        teacher = session.query(User).filter(User.email == DEMO_TEACHER_EMAIL).first()
    if teacher is None:
        teacher = User(
            id=DEMO_TEACHER_ID, email=DEMO_TEACHER_EMAIL, role=UserRole.teacher,
            is_active=True, is_verified=True, first_name="Contenu", last_name="Hi! PARIS",
        )
        session.add(teacher)
        session.flush()
    return teacher


def upgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)

    from models.user import User, UserRole
    from models.video import Video, VideoVisibility
    from models.app import App, AppVisibility
    from models.mooc import MOOC, MOOCModule, MOOCModuleCourse, MOOCStatus

    teacher = _get_demo_teacher(session, User, UserRole)
    now = datetime.now(timezone.utc)

    # ── Vidéos ────────────────────────────────────────────────────────────────
    if session.get(Video, "1") is None:
        for vid, title, yt, desc, category, school, tags, dur, views, thumb in VIDEOS:
            session.add(Video(
                id=vid, title=title, description=desc, youtube_id=yt, thumbnail_url=thumb,
                category=category, school=school, tags=json.dumps(tags),
                visibility=VideoVisibility.public, duration_seconds=_dur_to_seconds(dur),
                view_count=views, created_by=teacher.id, created_at=now, updated_at=now,
            ))

    # ── Apps ──────────────────────────────────────────────────────────────────
    if session.get(App, "1") is None:
        for aid, title, desc, url, tags, school in APPS:
            session.add(App(
                id=aid, title=title, description=desc, url=url, tags=json.dumps(tags),
                school=school, visibility=AppVisibility.public, created_by=teacher.id,
                created_at=now, updated_at=now,
            ))

    # ── MOOCs (+ modules + cours liés) ────────────────────────────────────────
    if session.get(MOOC, "1") is None:
        for mid, title, desc, school, modules in MOOCS:
            mooc = MOOC(
                id=mid, title=title, description=desc, school=school,
                status=MOOCStatus.published, is_linear=True, created_by=teacher.id,
                created_at=now, updated_at=now,
                modules=[
                    MOOCModule(
                        id=str(uuid.uuid4()), title=mod_title, position=mpos,
                        courses=[
                            MOOCModuleCourse(id=str(uuid.uuid4()), course_id=cid, position=cpos)
                            for cpos, cid in enumerate(course_ids)
                        ],
                    )
                    for mpos, (mod_title, course_ids) in enumerate(modules)
                ],
            )
            session.add(mooc)

    session.flush()  # alembic commit la transaction


def downgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)

    from models.video import Video
    from models.app import App
    from models.mooc import MOOC, MOOCModule, MOOCModuleCourse

    video_ids = [str(i) for i in range(1, 10)]
    app_ids = [str(i) for i in range(1, 9)]
    mooc_ids = ["1", "2", "3"]

    module_ids = [m.id for m in session.query(MOOCModule).filter(MOOCModule.mooc_id.in_(mooc_ids)).all()]
    if module_ids:
        session.query(MOOCModuleCourse).filter(MOOCModuleCourse.module_id.in_(module_ids)).delete(synchronize_session=False)
    session.query(MOOCModule).filter(MOOCModule.mooc_id.in_(mooc_ids)).delete(synchronize_session=False)
    session.query(MOOC).filter(MOOC.id.in_(mooc_ids)).delete(synchronize_session=False)
    session.query(Video).filter(Video.id.in_(video_ids)).delete(synchronize_session=False)
    session.query(App).filter(App.id.in_(app_ids)).delete(synchronize_session=False)
    session.flush()
