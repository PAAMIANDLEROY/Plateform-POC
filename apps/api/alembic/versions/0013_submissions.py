"""create submissions (uploads « About us »)

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("filename", sa.String(400), nullable=False),
        sa.Column("content_type", sa.String(150), nullable=True),
        sa.Column("size", sa.Integer, nullable=False, server_default="0"),
        sa.Column("storage_path", sa.String(600), nullable=False),
        sa.Column("uploaded_by", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_submissions_uploaded_by", "submissions", ["uploaded_by"])
    op.create_index("ix_submissions_created_at", "submissions", ["created_at"])


def downgrade() -> None:
    op.drop_table("submissions")
