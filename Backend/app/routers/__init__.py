from fastapi import FastAPI

from app.routers.catalogs import router as catalogs_router
from app.routers.files import router as files_router


def include_routers(app: FastAPI) -> None:
	"""Registra todos los routers de la API en la app principal."""
	app.include_router(catalogs_router)
	app.include_router(files_router)


__all__ = ["include_routers"]
