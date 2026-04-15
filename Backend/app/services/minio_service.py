import io

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class MinioService:
    """Gestiona la subida y descarga de archivos en MinIO."""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self._ensure_buckets()

    def _ensure_buckets(self):
        """Crea los buckets si no existen al iniciar el servicio."""
        for bucket in [settings.minio_bucket_sources, settings.minio_bucket_exports]:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)

    def upload_source(
        self,
        file_bytes: bytes,
        filename: str,
        year: int,
        month_initials: str,
    ) -> str:
        """
        Sube el Excel original a neuralreport-fuentes.
        Ruta: /{year}/{month}/filename.xlsx
        Retorna la ruta completa guardada en BD.
        """
        object_name = f"{year}/{month_initials}/{filename}"
        self.client.put_object(
            bucket_name=settings.minio_bucket_sources,
            object_name=object_name,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        return object_name

    def upload_export(
        self,
        file_bytes: bytes,
        filename: str,
        year: int,
        month_initials: str,
    ) -> str:
        """
        Sube el Excel generado a neuralreport-exportados.
        Ruta: /{year}/{month}/filename.xlsx
        Retorna la ruta completa guardada en BD.
        """
        object_name = f"{year}/{month_initials}/{filename}"
        self.client.put_object(
            bucket_name=settings.minio_bucket_exports,
            object_name=object_name,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        return object_name

    def download(self, bucket: str, object_name: str) -> bytes:
        """Descarga un archivo desde MinIO y retorna sus bytes."""
        try:
            response = self.client.get_object(bucket, object_name)
            return response.read()
        except S3Error as e:
            raise FileNotFoundError(f"Archivo no encontrado en MinIO: {object_name}") from e


minio_service = MinioService()