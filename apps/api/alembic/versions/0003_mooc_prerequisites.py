"""Add prerequisite fields to mooc_modules (Phase 5.2)

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-05
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "mooc_modules",
        sa.Column("min_score_to_unlock", sa.Integer(), nullable=True),
    )
    op.add_column(
        "mooc_modules",
        sa.Column(
            "prerequisite_module_id",
            sa.String(36),
            sa.ForeignKey("mooc_modules.id"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("mooc_modules", "prerequisite_module_id")
    op.drop_column("mooc_modules", "min_score_to_unlock")
