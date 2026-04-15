from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


# ─── File ───────────────────────────────────────────────────

class FileResponse(BaseModel):
    id:         int
    year_id:    int
    month_id:   int
    file_url:   str | None
    importe:    float
    status_id:  int
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# ─── FileDetail ─────────────────────────────────────────────

class FileDetailItem(BaseModel):
    """Una fila del detalle diario: tienda + día + licencias."""
    store_code: int
    day:        int
    licenses:   int

    @field_validator("day")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if not 1 <= v <= 31:
            raise ValueError("El día debe estar entre 1 y 31")
        return v

    @field_validator("licenses")
    @classmethod
    def validate_licenses(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Las licencias no pueden ser negativas")
        return v


class FileDetailResponse(BaseModel):
    id:         int
    file_id:    int
    store_code: int
    day:        int
    licenses:   int

    model_config = ConfigDict(from_attributes=True)


# ─── FileTotal ──────────────────────────────────────────────

class FileTotalResponse(BaseModel):
    """Total por tienda para un mes — lo que se muestra en la tabla por pestaña."""
    id:             int
    file_id:        int
    store_code:     int
    total_days:     int
    total_licenses: int
    total_value:    float
    was_edited:     bool
    edited_at:      datetime | None

    model_config = ConfigDict(from_attributes=True)


class FileTotalEditRequest(BaseModel):
    """El usuario corrige el total_value de una tienda desde la interfaz."""
    total_value: float

    @field_validator("total_value")
    @classmethod
    def validate_total_value(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El valor total no puede ser negativo")
        return v


# ─── Upload response ────────────────────────────────────────

class FileUploadResponse(BaseModel):
    """
    Respuesta completa al subir y procesar un Excel.
    Devuelve el archivo creado y los totales por tienda
    para mostrar en la pestaña del mes correspondiente.
    """
    file:   FileResponse
    totals: list[FileTotalResponse]