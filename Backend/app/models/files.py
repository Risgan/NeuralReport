from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class File(Base):
    """Registro de cada Excel mensual subido."""

    __tablename__ = "files"

    id:         Mapped[int]            = mapped_column(Integer, primary_key=True)
    year_id:    Mapped[int]            = mapped_column(Integer, ForeignKey("years.id"),  nullable=False)
    month_id:   Mapped[int]            = mapped_column(Integer, ForeignKey("months.id"), nullable=False)
    file_url:   Mapped[str | None]     = mapped_column(String(500))
    importe:    Mapped[float]          = mapped_column(Numeric(12, 2), nullable=False)
    status_id:  Mapped[int]            = mapped_column(Integer, ForeignKey("status.id"), nullable=False)
    created_at: Mapped[datetime]       = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime | None]= mapped_column(DateTime, onupdate=func.now())

    # Relaciones
    details: Mapped[list["FileDetail"]] = relationship("FileDetail", back_populates="file", cascade="all, delete-orphan")
    totals:  Mapped[list["FileTotal"]]  = relationship("FileTotal",  back_populates="file", cascade="all, delete-orphan")


class FileDetail(Base):
    """Detalle diario de licencias por tienda."""

    __tablename__ = "file_details"

    id:         Mapped[int] = mapped_column(Integer, primary_key=True)
    file_id:    Mapped[int] = mapped_column(Integer, ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    store_code: Mapped[int] = mapped_column(Integer, nullable=False)
    day:        Mapped[int] = mapped_column(Integer, nullable=False)
    licenses:   Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relación inversa
    file: Mapped["File"] = relationship("File", back_populates="details")


class FileTotal(Base):
    """Totales por tienda dentro de un archivo mensual."""

    __tablename__ = "file_totals"

    id:             Mapped[int]            = mapped_column(Integer, primary_key=True)
    file_id:        Mapped[int]            = mapped_column(Integer, ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    store_code:     Mapped[int]            = mapped_column(Integer, nullable=False)
    total_days:     Mapped[int]            = mapped_column(Integer, nullable=False)
    total_licenses: Mapped[int]            = mapped_column(Integer, nullable=False)
    total_value:    Mapped[float]          = mapped_column(Numeric(14, 2), nullable=False)
    was_edited:     Mapped[bool]           = mapped_column(Boolean, nullable=False, default=False)
    edited_at:      Mapped[datetime | None]= mapped_column(DateTime)

    # Relación inversa
    file: Mapped["File"] = relationship("File", back_populates="totals")