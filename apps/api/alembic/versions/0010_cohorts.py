"""create cohorts, cohort_members, cohort_courses

Lot 3 — cohortes (voir ROLES-ET-DROITS.md §5). Les colonnes de statut sont des
VARCHAR (même convention que les autres tables de contenu : status en String).

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cohorts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("school", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_cohorts_owner_id", "cohorts", ["owner_id"])

    op.create_table(
        "cohort_members",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("cohort_id", sa.String(36), sa.ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_cohort_members_cohort_id", "cohort_members", ["cohort_id"])
    op.create_index("ix_cohort_members_user_id", "cohort_members", ["user_id"])
    op.create_unique_constraint("uq_cohort_member", "cohort_members", ["cohort_id", "user_id"])

    op.create_table(
        "cohort_courses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("cohort_id", sa.String(36), sa.ForeignKey("cohorts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("granted_by", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_cohort_courses_cohort_id", "cohort_courses", ["cohort_id"])
    op.create_index("ix_cohort_courses_course_id", "cohort_courses", ["course_id"])
    op.create_unique_constraint("uq_cohort_course", "cohort_courses", ["cohort_id", "course_id"])


def downgrade() -> None:
    op.drop_table("cohort_courses")
    op.drop_table("cohort_members")
    op.drop_table("cohorts")
