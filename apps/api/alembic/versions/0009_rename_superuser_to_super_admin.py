"""rename userrole enum value 'superuser' -> 'super_admin'

Aligne la valeur d'enum sur le nommage produit final (cf. ROLES-ET-DROITS.md §0).
`super_admin` = plus haut niveau (le fondateur). Le mot « superuser » disparaît du code.

Sur PostgreSQL : `ALTER TYPE ... RENAME VALUE` renomme la valeur en place — les lignes
existantes portant 'superuser' deviennent 'super_admin' automatiquement.
Sur les autres dialectes (SQLite en test), l'enum est un simple VARCHAR : rien à faire,
le schéma est déjà à jour via create_all.

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-03
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TYPE userrole RENAME VALUE 'superuser' TO 'super_admin'")


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TYPE userrole RENAME VALUE 'super_admin' TO 'superuser'")
