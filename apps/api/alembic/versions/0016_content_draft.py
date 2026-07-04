"""ajoute content_blocks.draft_value (brouillon / publication)

Revision ID: 0016
Revises: 0015
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("content_blocks", sa.Column("draft_value", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("content_blocks", "draft_value")
