"""status-param

Revision ID: d09b630ae0d1
Revises: ce376380915f
Create Date: 2026-04-19 20:35:00.204423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd09b630ae0d1'
down_revision: Union[str, Sequence[str], None] = 'ce376380915f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    statuses = [
        {"name": "Borrador",   "active": True},
        {"name": "Procesado",  "active": True},
        {"name": "Finalizado", "active": True},
    ]
    

    params = [
        {"name": "iva", "value": 0.190000, "description": "Total * IVA (19%)", "active": True},
        {"name": "fte", "value": 0.035000, "description": "Total * ReteFuente (3.5%)", "active": True},
        {"name": "ica", "value": 0.006900, "description": "Total * ReteICA (6.9‰)", "active": True},
        {"name": "importe", "value": 4065.000000, "description": "Valor base por licencia al día", "active": True}
    ]

    insert_status = sa.text(
        """
        INSERT INTO status (name, active)
        VALUES (:name, :active)
        ON CONFLICT (name) DO NOTHING
        """
    )
    
    for status in statuses:
        connection.execute(insert_status, status)
    

    insert_param = sa.text(
        """
        INSERT INTO params (name, value, description, active)
        VALUES (:name, :value, :description, :active)
        ON CONFLICT (name) DO NOTHING
        """
    )
    for param in params:
        connection.execute(insert_param, param)


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            DELETE FROM params
            WHERE name IN ('iva', 'fte', 'ica', 'importe')
            """
        )
    )

    connection.execute(
        sa.text(
            """
            DELETE FROM status
            WHERE name IN ('Borrador', 'Procesado', 'Finalizado')
            """
        )
    )
