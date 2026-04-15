from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Year(Base):
    """Catálogo de años habilitados en el sistema."""

    __tablename__ = "years"

    id:     Mapped[int]  = mapped_column(Integer, primary_key=True, autoincrement=True)
    year:   Mapped[int]  = mapped_column(Integer, nullable=False, unique=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Month(Base):
    """Catálogo fijo de los 12 meses del año."""

    __tablename__ = "months"

    id:               Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    month_name:       Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    month_initials:   Mapped[str] = mapped_column(String(3),  nullable=False, unique=True)


class Status(Base):
    """Catálogo de estados del ciclo de vida."""

    __tablename__ = "status"

    id:     Mapped[int]  = mapped_column(Integer, primary_key=True, autoincrement=True)
    name:   Mapped[str]  = mapped_column(String(20), nullable=False, unique=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Param(Base):
    """Parámetros globales configurables del sistema."""

    __tablename__ = "params"

    id:          Mapped[int]   = mapped_column(Integer, primary_key=True, autoincrement=True)
    name:        Mapped[str]   = mapped_column(String(30),  nullable=False, unique=True)
    value:       Mapped[float] = mapped_column(Numeric(10, 6), nullable=False)
    description: Mapped[str]   = mapped_column(String(100), nullable=False)
    active:      Mapped[bool]  = mapped_column(Boolean, nullable=False, default=True)