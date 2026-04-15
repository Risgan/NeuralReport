from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.files import FileDetailResponse, FileResponse, FileTotalResponse, FileTotalEditRequest, FileUploadResponse, FileDetailItem
from app.services.files_service import FilesService

router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/", response_model=list[FileResponse])
def get_files(db: Session = Depends(get_db)) -> list[FileResponse]:
    service = FilesService(db)
    return service.get_files()

@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file_detail(file_id: int, db: Session = Depends(get_db)) -> FileDetailResponse:
    service = FilesService(db)
    return service.get_file_detail(file_id)

@router.put("/totals/{total_id}", response_model=FileTotalResponse)
def edit_file_total(total_id: int, edit_request: FileTotalEditRequest, db: Session = Depends(get_db)) -> FileTotalResponse:
    service = FilesService(db)
    return service.edit_file_total(total_id, edit_request)

@router.post("/upload", response_model=FileUploadResponse)
def upload_file(file_url: str, year_id: int, month_id: int, importe: float, db: Session = Depends(get_db)) -> FileUploadResponse:
    service = FilesService(db)
    return service.upload_file(file_url, year_id, month_id, importe)


@router.patch("/details/{detail_id}", response_model=FileDetailItem)
def edit_file_detail(detail_id: int, licenses: int, db: Session = Depends(get_db)) -> FileDetailItem:
    service = FilesService(db)
    return service.edit_file_detail(detail_id, licenses)