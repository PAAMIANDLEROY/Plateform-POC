"""extend user profile + add otps, badges, certificates tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-11
"""
from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users: add profile columns ─────────────────────────────────────────────
    op.add_column("users", sa.Column("school", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text, nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("linkedin", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("github", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("consent_analytics", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("users", sa.Column("consent_tracking", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("users", sa.Column("consent_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("is_anonymized", sa.Boolean, nullable=False, server_default="false"))

    # ── user_course_progress: add learning metrics ─────────────────────────────
    op.add_column("user_course_progress", sa.Column("progress_pct", sa.Integer, nullable=False, server_default="0"))
    op.add_column("user_course_progress", sa.Column("score", sa.Integer, nullable=True))
    op.add_column("user_course_progress", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.create_unique_constraint(
        "uq_user_course_progress_user_course",
        "user_course_progress",
        ["user_id", "course_id"],
    )

    # ── user_mooc_enrollments: add completed_modules tracking ──────────────────
    op.add_column("user_mooc_enrollments", sa.Column("completed_modules", sa.JSON, nullable=True))
    op.create_unique_constraint(
        "uq_user_mooc_enrollment_user_mooc",
        "user_mooc_enrollments",
        ["user_id", "mooc_id"],
    )

    # ── OTPs ──────────────────────────────────────────────────────────────────
    op.create_table(
        "otps",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_otps_email", "otps", ["email"])

    # ── User badges ───────────────────────────────────────────────────────────
    op.create_table(
        "user_badges",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", sa.String(50), nullable=False),
        sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_user_badges_user_id", "user_badges", ["user_id"])
    op.create_unique_constraint("uq_user_badge", "user_badges", ["user_id", "badge_id"])

    # ── User certificates ─────────────────────────────────────────────────────
    op.create_table(
        "user_certificates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.String(36), nullable=False),
        sa.Column("course_title", sa.String(500), nullable=False),
        sa.Column("user_name", sa.String(300), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("verification_token", sa.String(100), nullable=False, unique=True),
    )
    op.create_index("ix_user_certificates_user_id", "user_certificates", ["user_id"])
    op.create_unique_constraint("uq_user_certificate_course", "user_certificates", ["user_id", "course_id"])


def downgrade() -> None:
    op.drop_table("user_certificates")
    op.drop_table("user_badges")
    op.drop_index("ix_otps_email", table_name="otps")
    op.drop_table("otps")
    op.drop_constraint("uq_user_mooc_enrollment_user_mooc", "user_mooc_enrollments", type_="unique")
    op.drop_column("user_mooc_enrollments", "completed_modules")
    op.drop_constraint("uq_user_course_progress_user_course", "user_course_progress", type_="unique")
    op.drop_column("user_course_progress", "started_at")
    op.drop_column("user_course_progress", "score")
    op.drop_column("user_course_progress", "progress_pct")
    op.drop_column("users", "is_anonymized")
    op.drop_column("users", "consent_updated_at")
    op.drop_column("users", "consent_tracking")
    op.drop_column("users", "consent_analytics")
    op.drop_column("users", "github")
    op.drop_column("users", "linkedin")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_column("users", "school")
