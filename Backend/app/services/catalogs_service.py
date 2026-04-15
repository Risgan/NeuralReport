from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalogs import Month, Param, Year, Status
from app.schemas.catalogs import MonthResponse, ParamResponse, StatusResponse, YearResponse


class CatalogsService:
    """Servicio de lectura de catalogos base."""

    def __init__(self, db: Session):
        self.db = db

    def get_years(self, only_active: bool = True) -> list[YearResponse]:
        query = select(Year)
        if only_active:
            query = query.where(Year.active.is_(True))

        rows = self.db.scalars(query.order_by(Year.year)).all()
        return [YearResponse.model_validate(row) for row in rows]

    def get_months(self) -> list[MonthResponse]:
        rows = self.db.scalars(select(Month).order_by(Month.id)).all()
        return [MonthResponse.model_validate(row) for row in rows]

    def get_params(self, only_active: bool = True) -> list[ParamResponse]:
        query = select(Param)
        if only_active:
            query = query.where(Param.active.is_(True))

        rows = self.db.scalars(query.order_by(Param.name)).all()
        return [ParamResponse.model_validate(row) for row in rows]

    def get_status(self, only_active: bool = True) -> list[StatusResponse]:
        query = select(Status)
        # if only_active:
        #     query = query.where(Status.active.is_(True))

        rows = self.db.scalars(query.order_by(Status.name)).all()
        return [StatusResponse.model_validate(row) for row in rows]

    def get_base_catalogs(self) -> dict[str, list]:
        """Retorna los tres catalogos en una sola llamada."""
        return {
            "years": self.get_years(),
            # "months": self.get_months(),
            "params": self.get_params(),
        }
