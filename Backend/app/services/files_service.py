from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.files import File, FileDetail, FileTotal
from app.schemas.files import FileDetailResponse, FileResponse, FileTotalResponse, FileTotalEditRequest, FileUploadResponse, FileDetailItem

class FilesService:
    """Servicio de lectura de archivos."""

    def __init__(self, db: Session):
        self.db = db

    def get_files(self) -> list[FileResponse]:
        rows = self.db.scalars(select(File).order_by(File.id)).all()
        return [FileResponse.model_validate(row) for row in rows]
    
    def get_file_detail(self, file_id: int) -> FileDetailResponse:
        file = self.db.get(File, file_id)
        if not file:
            raise ValueError(f"Archivo con id {file_id} no encontrado.")
        
        details = self.db.scalars(select(FileDetail).where(FileDetail.file_id == file_id)).all()
        totals = self.db.scalars(select(FileTotal).where(FileTotal.file_id == file_id)).all()

        return FileDetailResponse(
            file=FileResponse.model_validate(file),
            details=[FileDetailItem.model_validate(detail) for detail in details],
            totals=[FileTotalResponse.model_validate(total) for total in totals],
        )
    
    def edit_file_total(self, total_id: int, edit_request: FileTotalEditRequest) -> FileTotalResponse:
        total = self.db.get(FileTotal, total_id)
        if not total:
            raise ValueError(f"Total con id {total_id} no encontrado.")
        
        total.total_value = edit_request.total_value
        total.was_edited = True
        self.db.commit()
        self.db.refresh(total)

        return FileTotalResponse.model_validate(total)
    
    def upload_file(self, file_url: str, year_id: int, month_id: int, importe: float) -> FileUploadResponse:
        new_file = File(
            file_url=file_url,
            year_id=year_id,
            month_id=month_id,
            importe=importe,
            status_id=1,  # Asumiendo que 1 es el status "Subido"
        )
        self.db.add(new_file)
        self.db.commit()
        self.db.refresh(new_file)

        return FileUploadResponse.model_validate(new_file)
    
    