"""add courses.access_level (public / hiparis / cohort)

Lot 4 — niveaux d'accès aux cours (voir ROLES-ET-DROITS.md §4).
Colonne VARCHAR (même convention que les autres colonnes de statut). Défaut "public"
→ tous les cours existants restent visibles de tous (comportement inchangé).

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("access_level", sa.String(20), nullable=False, server_default="public"),
    )


def downgrade() -> None:
    op.drop_column("courses", "access_level")
