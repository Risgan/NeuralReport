"""years-month

Revision ID: ce376380915f
Revises: d79d1f8d4976
Create Date: 2026-04-19 20:20:48.928316

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ce376380915f'
down_revision: Union[str, Sequence[str], None] = 'd79d1f8d4976'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            INSERT INTO years (year, active)
            VALUES (:year, :active)
            ON CONFLICT (year) DO NOTHING
            """
        ),
        {"year": 2026, "active": True},
    )

    months = [
        {"month_name": "Enero", "month_initials": "Ene"},
        {"month_name": "Febrero", "month_initials": "Feb"},
        {"month_name": "Marzo", "month_initials": "Mar"},
        {"month_name": "Abril", "month_initials": "Abr"},
        {"month_name": "Mayo", "month_initials": "May"},
        {"month_name": "Junio", "month_initials": "Jun"},
        {"month_name": "Julio", "month_initials": "Jul"},
        {"month_name": "Agosto", "month_initials": "Ago"},
        {"month_name": "Septiembre", "month_initials": "Sep"},
        {"month_name": "Octubre", "month_initials": "Oct"},
        {"month_name": "Noviembre", "month_initials": "Nov"},
        {"month_name": "Diciembre", "month_initials": "Dic"},
    ]

    insert_month_sql = sa.text(
        """
        INSERT INTO months (month_name, month_initials)
        VALUES (:month_name, :month_initials)
        ON CONFLICT (month_name) DO NOTHING
        """
    )
    for month in months:
        connection.execute(insert_month_sql, month)


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    connection.execute(sa.text("DELETE FROM years WHERE year = :year"), {"year": 2026})
    connection.execute(
        sa.text(
            """
            DELETE FROM months
            WHERE month_initials IN (
                'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
            )
            """
        )
    )
