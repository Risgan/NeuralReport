from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Report(Base):
    """Cabecera del informe trimestral."""

    __tablename__ = "reports"

    id:         Mapped[int]             = mapped_column(Integer, primary_key=True)
    year_id:    Mapped[int]             = mapped_column(Integer, ForeignKey("years.id"),  nullable=False)
    month1_id:  Mapped[int]             = mapped_column(Integer, ForeignKey("months.id"), nullable=False)
    month2_id:  Mapped[int]             = mapped_column(Integer, ForeignKey("months.id"), nullable=False)
    month3_id:  Mapped[int]             = mapped_column(Integer, ForeignKey("months.id"), nullable=False)
    status_id:  Mapped[int]             = mapped_column(Integer, ForeignKey("status.id"), nullable=False)
    export_url: Mapped[str | None]      = mapped_column(String(500))
    created_at: Mapped[datetime]        = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())

    # Relaciones
    rows: Mapped[list["ReportRow"]] = relationship("ReportRow", back_populates="report", cascade="all, delete-orphan")


class ReportRow(Base):
    """Detalle por tienda del informe trimestral."""

    __tablename__ = "report_rows"

    id:           Mapped[int]   = mapped_column(Integer, primary_key=True)
    report_id:    Mapped[int]   = mapped_column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    store_code:   Mapped[int]   = mapped_column(Integer, nullable=False)
    value_month1: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    value_month2: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    value_month3: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    total_value:  Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    iva:          Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    retefuente:   Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    rete_ica:     Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    total_neto:   Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # Relación inversa
    report: Mapped["Report"] = relationship("Report", back_populates="rows")