from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


# Motor de conexión a PostgreSQL
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,    # verifica la conexión antes de usarla
    pool_size=10,          # conexiones simultáneas máximas
    max_overflow=20,       # conexiones extra permitidas bajo carga
    echo=settings.debug,   # imprime SQL en consola si debug=true
)

# Fábrica de sesiones
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# Clase base para todos los modelos
class Base(DeclarativeBase):
    pass