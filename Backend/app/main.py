from fastapi import FastAPI

from app.core.config import settings
from app.database import Base, engine
from app.routers import include_routers


# Crear tablas automáticamente si no existen
# (en producción esto se reemplaza por Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
)

include_routers(app)

@app.get("/", tags=["Health"])
def health_check():
    return {"app": settings.app_name, "version": settings.app_version, "status": "ok"}