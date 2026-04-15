from pydantic import BaseModel, ConfigDict


# ─── Year ───────────────────────────────────────────────────

class YearResponse(BaseModel):
    id:     int
    year:   int
    active: bool

    model_config = ConfigDict(from_attributes=True)


# ─── Month ──────────────────────────────────────────────────

class MonthResponse(BaseModel):
    id:              int
    month_name:      str
    month_initials:  str

    model_config = ConfigDict(from_attributes=True)


# ─── Status ─────────────────────────────────────────────────

class StatusResponse(BaseModel):
    id:     int
    name:   str
    active: bool

    model_config = ConfigDict(from_attributes=True)


# ─── Param ──────────────────────────────────────────────────

class ParamResponse(BaseModel):
    id:          int
    name:        str
    value:       float
    description: str
    active:      bool

    model_config = ConfigDict(from_attributes=True)


class ParamUpdateRequest(BaseModel):
    """Solo el valor es actualizable desde la interfaz."""
    value: float