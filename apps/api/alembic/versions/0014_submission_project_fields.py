"""enrichit submissions : projet EdTech NeuriPP (repo, licence, catégorie…) + pièce jointe optionnelle

Revision ID: 0014
Revises: 0013
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("submissions", sa.Column("project_name", sa.String(300), nullable=True))
    op.add_column("submissions", sa.Column("repo_url", sa.String(500), nullable=True))
    op.add_column("submissions", sa.Column("pages_url", sa.String(500), nullable=True))
    op.add_column("submissions", sa.Column("demo_url", sa.String(500), nullable=True))
    op.add_column("submissions", sa.Column("license", sa.String(80), nullable=True))
    op.add_column("submissions", sa.Column("usage_category", sa.String(60), nullable=True))
    op.add_column("submissions", sa.Column("domain_scope", sa.String(20), nullable=True))
    op.add_column("submissions", sa.Column("domain_detail", sa.String(300), nullable=True))
    op.add_column("submissions", sa.Column("model_type", sa.String(20), nullable=True))
    op.add_column("submissions", sa.Column("authors", sa.Text, nullable=True))
    op.add_column("submissions", sa.Column("description", sa.Text, nullable=True))
    op.add_column("submissions", sa.Column("rules_consent", sa.Boolean, nullable=False, server_default=sa.false()))

    # La pièce jointe devient optionnelle (le cœur de la soumission = les métadonnées projet).
    op.alter_column("submissions", "filename", existing_type=sa.String(400), nullable=True)
    op.alter_column("submissions", "storage_path", existing_type=sa.String(600), nullable=True)


def downgrade() -> None:
    op.alter_column("submissions", "storage_path", existing_type=sa.String(600), nullable=False)
    op.alter_column("submissions", "filename", existing_type=sa.String(400), nullable=False)
    for col in ("rules_consent", "description", "authors", "model_type", "domain_detail",
                "domain_scope", "usage_category", "license", "demo_url", "pages_url",
                "repo_url", "project_name"):
        op.drop_column("submissions", col)
