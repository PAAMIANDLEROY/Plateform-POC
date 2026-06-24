"""Create insights table + seed the 4 demo articles

La table `insights` est nouvelle (créée ici depuis le modèle ORM) puis peuplée
avec les 4 articles de démonstration (mêmes ids que le front : 1..4).

Idempotent : table créée avec checkfirst, seed sauté si l'article "1" existe.

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-25
"""
import json
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
from sqlalchemy.orm import Session

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEMO_TEACHER_ID = "11111111-1111-1111-1111-111111111111"
DEMO_TEACHER_EMAIL = "contenu.demo@ip-paris.fr"

CODE_VLM = (
    "# Exemple simplifié d'architecture VLM\n"
    "class VisionLanguageModel(nn.Module):\n"
    "    def __init__(self):\n"
    "        self.vision_encoder = CLIPEncoder()\n"
    "        self.projection = nn.Linear(768, 4096)\n"
    "        self.llm = LlamaModel()\n"
    "\n"
    "    def forward(self, image, text_tokens):\n"
    "        visual_features = self.projection(self.vision_encoder(image))\n"
    "        return self.llm(text_tokens, visual_prefix=visual_features)"
)

CODE_FEDAVG = (
    "# FedAvg simplifié\n"
    "def federated_avg(global_model, client_updates, weights):\n"
    "    aggregated = {}\n"
    "    for key in global_model.state_dict():\n"
    "        aggregated[key] = sum(\n"
    "            w * u[key] for w, u in zip(weights, client_updates)\n"
    "        )\n"
    "    global_model.load_state_dict(aggregated)\n"
    "    return global_model"
)

# Les 4 articles (id, titre, abstract, authors, tags, school, category, cover, published_at, read_time, blocks)
INSIGHTS = [
    {
        "id": "1",
        "title": "LLMs multimodaux : vers une compréhension unifiée texte-image",
        "abstract": "Nous explorons les architectures récentes qui permettent aux grands modèles de langage de traiter simultanément texte et images, et leurs implications pour l'enseignement.",
        "authors": ["Pr. Sophie Martin", "Dr. Lucas Durand"],
        "tags": ["LLM", "Multimodal", "Vision"],
        "school": "Polytechnique",
        "category": "IA & Cognition",
        "cover": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
        "published_at": "2026-04-18",
        "read_time": 8,
        "blocks": [
            {"type": "heading", "content": "Introduction", "level": 2},
            {"type": "text", "content": "Les modèles de langage de grande taille (LLMs) ont connu une évolution rapide ces dernières années. L'intégration de modalités visuelles ouvre de nouvelles perspectives pour l'IA générale."},
            {"type": "key-insight", "content": "Les architectures multimodales atteignent désormais des performances surhumaines sur des benchmarks de compréhension visuelle comme MMMU et MathVista."},
            {"type": "heading", "content": "Architecture Vision-Language", "level": 2},
            {"type": "text", "content": "Les modèles comme GPT-4o et Gemini Ultra utilisent un encodeur visuel connecté à un LLM via une couche de projection apprise. Cette approche permet une fusion sémantique profonde entre les deux modalités."},
            {"type": "code", "content": CODE_VLM, "language": "python"},
            {"type": "quote", "content": "La compréhension multimodale n'est pas la simple concaténation de deux modalités, mais une véritable fusion sémantique.", "author": "Pr. Sophie Martin"},
            {"type": "heading", "content": "Implications pédagogiques", "level": 2},
            {"type": "text", "content": "Ces avancées permettent d'envisager des tuteurs IA capables d'analyser des schémas, équations manuscrites et graphiques — transformant l'expérience d'apprentissage en ligne."},
        ],
    },
    {
        "id": "2",
        "title": "Apprentissage fédéré : préserver la confidentialité à grande échelle",
        "abstract": "Comment entraîner des modèles performants sur des données sensibles distribuées, sans jamais centraliser les données ? Un enjeu clé pour les données médicales et financières.",
        "authors": ["Dr. Amina Benali", "Pr. Jean-Pierre Moreau"],
        "tags": ["Federated Learning", "Privacy", "Distributed"],
        "school": "Télécom Paris",
        "category": "IA & Société",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
        "published_at": "2026-04-10",
        "read_time": 6,
        "blocks": [
            {"type": "heading", "content": "Le problème de la centralisation", "level": 2},
            {"type": "text", "content": "Les modèles d'IA traditionnels requièrent l'agrégation de grandes quantités de données. Or, dans des domaines comme la santé ou la finance, cette centralisation est impossible ou illégale (RGPD)."},
            {"type": "key-insight", "content": "L'apprentissage fédéré permet d'entraîner un modèle global sans que les données quittent jamais les appareils ou serveurs locaux."},
            {"type": "quote", "content": "Nous n'apprenons pas sur les données, nous apprenons avec les données — tout en les laissant là où elles appartiennent.", "author": "Dr. Amina Benali"},
            {"type": "heading", "content": "FedAvg et ses variantes", "level": 2},
            {"type": "text", "content": "L'algorithme FedAvg (McMahan et al., 2017) reste la référence. Chaque client entraîne localement, puis un serveur central agrège les gradients via une moyenne pondérée."},
            {"type": "code", "content": CODE_FEDAVG, "language": "python"},
        ],
    },
    {
        "id": "3",
        "title": "Modèles de diffusion pour la génération de données synthétiques",
        "abstract": "Les diffusion models révolutionnent la génération d'images et de données tabulaires. Nous analysons leur potentiel pour augmenter des jeux de données rares en contexte académique.",
        "authors": ["Dr. Claire Fontaine", "Thomas Mercier"],
        "tags": ["Diffusion Models", "Data Augmentation", "Generative AI"],
        "school": "ENSAE",
        "category": "Génération & Synthèse",
        "cover": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
        "published_at": "2026-03-28",
        "read_time": 10,
        "blocks": [
            {"type": "heading", "content": "Au-delà des GANs", "level": 2},
            {"type": "text", "content": "Les GANs ont longtemps dominé la génération de données synthétiques. Les modèles de diffusion, apparus avec DDPM (Ho et al., 2020), offrent une stabilité d'entraînement bien supérieure et une qualité de génération remarquable."},
            {"type": "key-insight", "content": "Sur le benchmark FID (Fréchet Inception Distance), Stable Diffusion 3 atteint un score de 4.2, contre 8.1 pour les meilleurs GANs."},
            {"type": "figure", "url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=60", "caption": "Visualisation du processus de débruitage itératif d'un modèle de diffusion."},
            {"type": "heading", "content": "Applications académiques", "level": 2},
            {"type": "text", "content": "Dans nos expériences, l'augmentation de jeux de données médicaux (imagerie IRM) avec des données synthétiques générées par diffusion améliore la précision de classification de 12 points."},
        ],
    },
    {
        "id": "4",
        "title": "Raisonnement symbolique et LLMs : une alliance prometteuse",
        "abstract": "L'intégration de contraintes logiques dans les LLMs permet de réduire les hallucinations et d'améliorer la fiabilité sur des tâches de raisonnement structuré.",
        "authors": ["Pr. Marc Leblanc"],
        "tags": ["Symbolic AI", "LLM", "Reasoning"],
        "school": "Polytechnique",
        "category": "IA & Raisonnement",
        "cover": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
        "published_at": "2026-03-15",
        "read_time": 7,
        "blocks": [
            {"type": "heading", "content": "Le problème des hallucinations", "level": 2},
            {"type": "text", "content": "Les LLMs souffrent d'hallucinations — ils produisent des réponses plausibles mais incorrectes. Les approches symboliques, basées sur des règles formelles, offrent une piste de solution."},
            {"type": "key-insight", "content": "L'approche neurosymbolique réduit les erreurs factuelles de 34% sur des benchmarks de QA à domaine fermé (MMLU Science)."},
            {"type": "quote", "content": "On ne résout pas le problème de la fiabilité en ajoutant plus de paramètres. Il faut réintégrer la structure.", "author": "Pr. Marc Leblanc"},
        ],
    },
]


def upgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)

    from models.insight import Insight, InsightStatus
    from models.user import User, UserRole

    # Crée la table insights depuis le modèle ORM (idempotent).
    Insight.__table__.create(bind, checkfirst=True)

    if session.get(Insight, "1") is not None:
        return

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

    now = datetime.now(timezone.utc)
    for a in INSIGHTS:
        session.add(Insight(
            id=a["id"], title=a["title"], abstract=a["abstract"],
            authors=json.dumps(a["authors"]), tags=json.dumps(a["tags"]),
            school=a["school"], category=a["category"], cover_url=a["cover"],
            read_time=a["read_time"], published_at=a["published_at"],
            status=InsightStatus.published, blocks=a["blocks"],
            created_by=teacher.id, created_at=now, updated_at=now,
        ))

    session.flush()


def downgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)
    from models.insight import Insight
    session.query(Insight).filter(Insight.id.in_(["1", "2", "3", "4"])).delete(synchronize_session=False)
    session.flush()
