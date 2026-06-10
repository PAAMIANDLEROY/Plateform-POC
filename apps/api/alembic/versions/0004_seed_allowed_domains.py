"""Seed initial allowed domains

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-11
"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INITIAL_DOMAINS = [
    ("polytechnique.edu",       "École Polytechnique"),
    ("telecom-paris.fr",        "Télécom Paris"),
    ("hec.fr",                  "HEC Paris"),
    ("hec.edu",                 "HEC Paris"),
    ("ensae.fr",                "ENSAE Paris"),
    ("ip-paris.fr",             "Institut Polytechnique de Paris"),
    ("ensta.fr",                "ENSTA Paris"),
    ("telecom-sudparis.fr",     "Télécom SudParis"),
    ("telecom-sudparis.edu",    "Télécom SudParis"),
    ("enpc.edu",                "École des Ponts ParisTech"),
    ("utt.fr",                  "Université de Technologie de Troyes"),
]


def upgrade() -> None:
    conn = op.get_bind()
    now = datetime.now(timezone.utc)
    for domain, school_name in INITIAL_DOMAINS:
        conn.execute(
            sa.text(
                "INSERT INTO allowed_domains (id, domain, school_name, created_at) "
                "VALUES (:id, :domain, :school_name, :created_at) "
                "ON CONFLICT (domain) DO NOTHING"
            ),
            {
                "id": str(uuid.uuid4()),
                "domain": domain,
                "school_name": school_name,
                "created_at": now,
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    domains = [d for d, _ in INITIAL_DOMAINS]
    conn.execute(
        sa.text("DELETE FROM allowed_domains WHERE domain = ANY(:domains)"),
        {"domains": domains},
    )
