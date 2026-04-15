from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


# ─── ReportRow ──────────────────────────────────────────────

class ReportRowResponse(BaseModel):
    """Una fila del informe: una tienda con sus 3 meses e impuestos."""
    id:           int
    report_id:    int
    store_code:   int
    value_month1: float
    value_month2: float
    value_month3: float
    total_value:  float
    iva:          float
    retefuente:   float
    rete_ica:     float
    total_neto:   float

    model_config = ConfigDict(from_attributes=True)


# ─── Report ─────────────────────────────────────────────────

class ReportResponse(BaseModel):
    id:         int
    year_id:    int
    month1_id:  int
    month2_id:  int
    month3_id:  int
    status_id:  int
    export_url: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(BaseModel):
    """
    Respuesta completa del informe trimestral:
    cabecera + todas las filas por tienda + totales generales.
    """
    report:       ReportResponse
    rows:         list[ReportRowResponse]
    total_bruto:  float   # suma de total_value de todas las tiendas
    total_iva:    float
    total_fte:    float
    total_ica:    float
    total_neto:   float


# ─── Generate request ───────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    """
    El frontend manda el año y el mes de inicio.
    El backend deduce los 3 meses automáticamente.
    """
    year_id:    int
    month1_id:  int   # mes de inicio del trimestre

    @model_validator(mode="after")
    def validate_ids(self) -> "ReportGenerateRequest":
        if self.year_id <= 0:
            raise ValueError("year_id debe ser mayor a 0")
        if not 1 <= self.month1_id <= 12:
            raise ValueError("month1_id debe estar entre 1 y 12")
        return self