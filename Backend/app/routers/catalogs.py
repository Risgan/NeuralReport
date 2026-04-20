from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.catalogs import MonthResponse, StatusResponse, YearResponse, ParamResponse
from app.services.catalogs_service import CatalogsService

router = APIRouter(prefix="/catalogs", tags=["Catalogs"])


@router.get("/years", response_model=list[YearResponse])
def get_years(db: Session = Depends(get_db)) -> list[YearResponse]:
	service = CatalogsService(db)
	return service.get_years(only_active=True)

@router.post("/years", response_model=YearResponse)
def create_year(year: int, db: Session = Depends(get_db)) -> YearResponse:
    service = CatalogsService(db)
    return service.create_year(year)


@router.get("/months", response_model=list[MonthResponse])
def get_months(db: Session = Depends(get_db)) -> list[MonthResponse]:
	service = CatalogsService(db)
	return service.get_months()


@router.get("/params", response_model=list[ParamResponse])
def get_params(db: Session = Depends(get_db)) -> list[ParamResponse]:
    service = CatalogsService(db)
    return service.get_params(only_active=True)


@router.get("/status", response_model=list[StatusResponse])
def get_status(db: Session = Depends(get_db)) -> list[StatusResponse]:
    service = CatalogsService(db)
    return service.get_status(only_active=True)


@router.get("/base", response_model=dict[str, list])
def get_base_catalogs(db: Session = Depends(get_db)) -> dict[str, list]:
    service = CatalogsService(db)
    return service.get_base_catalogs()

