"""Seed demo courses + blocks

Sur une base Supabase fraîche, les tables sont créées mais vides : les pages
/courses/{id} renvoient alors 404 ("Cours introuvable"). Cette migration insère
les cours de démonstration (les mêmes ids que le catalogue front : 1..11) avec
quelques blocs chacun, afin que le catalogue et les pages de détail fonctionnent.

Idempotent : si le cours "1" existe déjà, la migration ne fait rien.

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-24
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
from sqlalchemy.orm import Session

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Enseignant démo, propriétaire des cours (Course.created_by est une FK NOT NULL).
DEMO_TEACHER_ID = "11111111-1111-1111-1111-111111111111"
DEMO_TEACHER_EMAIL = "contenu.demo@ip-paris.fr"

# (id, titre, description, catégorie, niveau, école, durée_min, statut)
# ids et métadonnées alignés sur le catalogue front (lib/mock.ts MOCK_CATALOGUE).
COURSES = [
    ("1",  "Fondamentaux du ML",              "Régression, classification, évaluation de modèles.",                             "IA & Data",         "beginner",     "Polytechnique", 180, "published"),
    ("2",  "Python pour la Data Science",     "NumPy, Pandas, Matplotlib, Scikit-learn.",                                       "Programmation",     "beginner",     "Télécom Paris", 240, "published"),
    ("3",  "Réseaux de neurones profonds",    "Architectures CNN, RNN, Transformer.",                                           "IA & Data",         "advanced",     "Polytechnique", 360, "published"),
    ("4",  "Séries temporelles",              "ARIMA, Prophet, forecasting avec ML.",                                           "IA & Data",         "intermediate", "ENSAE",         150, "published"),
    ("5",  "Introduction à R",                "Analyse statistique et visualisation avec R.",                                   "Statistiques",      "beginner",     "ENSAE",         120, "draft"),
    ("6",  "Cloud Computing & MLOps",         "Docker, Kubernetes, pipelines CI/CD ML.",                                        "DevOps",            "advanced",     "Télécom Paris", 300, "published"),
    ("7",  "Reinforcement Learning",          "Q-Learning, Policy Gradients, AlphaGo et applications modernes.",                "IA & Data",         "advanced",     "Polytechnique", 270, "published"),
    ("8",  "Computer Vision avancée",         "Détection d'objets, segmentation, YOLO et Vision Transformers.",                 "IA & Data",         "intermediate", "Télécom Paris", 210, "published"),
    ("9",  "NLP from Scratch",                "Tokenisation, embeddings, attention et construction d'un LLM miniature.",        "IA & Data",         "intermediate", "Télécom Paris", 240, "published"),
    ("10", "Éthique et gouvernance de l'IA",  "Biais algorithmiques, RGPD, explicabilité et régulation européenne.",            "Société & Éthique", "beginner",     "HEC",            90, "published"),
    ("11", "Modèles génératifs & diffusion",  "GANs, VAEs, diffusion models et leurs applications en génération de données.",   "IA & Data",         "advanced",     "ENSAE",         330, "draft"),
]


def _blocks_for(title: str, description: str):
    """Construit une petite séquence de blocs pédagogiques pour un cours."""
    return [
        ("heading",  {"content": "Introduction"}),
        ("text",     {"content": f"Bienvenue dans « {title} ». {description} Ce module mêle théorie et pratique, avec des exercices à chaque étape."}),
        ("heading",  {"content": "Concepts clés"}),
        ("text",     {"content": "Avant de passer aux travaux pratiques, posons les fondations indispensables et le vocabulaire utilisé tout au long du cours."}),
        ("markdown", {"content": "# Exemple rapide\nimport numpy as np\n\nX = np.array([1.0, 2.0, 3.0, 4.0])\nprint('moyenne =', X.mean())\nprint('ecart-type =', X.std())"}),
        ("quiz",     {
            "question": "Quel est l'objectif principal de ce module ?",
            "options": [
                "Mémoriser des formules par cœur",
                "Comprendre les concepts et savoir les appliquer",
                "Recopier du code sans le lire",
                "Aucun de ces objectifs",
            ],
            "answer": 1,
            "explanation": "L'objectif est de comprendre les concepts et de les mettre en pratique, pas de les mémoriser mécaniquement.",
        }),
        ("divider",  {}),
        ("text",     {"content": "Une fois les exercices terminés, vous pourrez passer au module suivant du parcours."}),
    ]


def upgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)

    # Import local des modèles : SQLAlchemy applique les valeurs par défaut
    # (uuid, timestamps, booléens…), ce qui évite d'énumérer chaque colonne.
    from models.user import User, UserRole
    from models.course import Course, CourseBlock, CourseLevel, CourseStatus, BlockType

    # Idempotence : si le contenu de démo est déjà là, ne rien faire.
    if session.get(Course, "1") is not None:
        return

    # Enseignant démo (créé une seule fois).
    teacher = session.get(User, DEMO_TEACHER_ID)
    if teacher is None:
        teacher = session.query(User).filter(User.email == DEMO_TEACHER_EMAIL).first()
    if teacher is None:
        teacher = User(
            id=DEMO_TEACHER_ID,
            email=DEMO_TEACHER_EMAIL,
            role=UserRole.teacher,
            is_active=True,
            is_verified=True,
            first_name="Contenu",
            last_name="Hi! PARIS",
        )
        session.add(teacher)
        session.flush()

    now = datetime.now(timezone.utc)
    for cid, title, desc, category, level, school, duration, status in COURSES:
        course = Course(
            id=cid,
            title=title,
            description=desc,
            category=category,
            tags=json.dumps([category]),
            level=CourseLevel(level),
            school=school,
            status=CourseStatus(status),
            estimated_duration_minutes=duration,
            created_by=teacher.id,
            created_at=now,
            updated_at=now,
            # La relation gère l'ordre d'insertion (cours puis blocs) et le course_id.
            blocks=[
                CourseBlock(id=str(uuid.uuid4()), position=pos, type=BlockType(btype), content=content)
                for pos, (btype, content) in enumerate(_blocks_for(title, desc))
            ],
        )
        session.add(course)

    session.flush()  # pas de commit : alembic commit la transaction de migration


def downgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)

    from models.course import Course, CourseBlock

    ids = [str(i) for i in range(1, 12)]
    session.query(CourseBlock).filter(CourseBlock.course_id.in_(ids)).delete(synchronize_session=False)
    session.query(Course).filter(Course.id.in_(ids)).delete(synchronize_session=False)
    session.flush()
