# NeuralReport

Guia rapida para levantar el proyecto en local (Windows + PowerShell), con secciones separadas de Backend y Frontend.

## Requisitos

- Python 3.11+
- Node.js 20+
- pnpm
- PostgreSQL (o contenedor)
- MinIO (si vas a usar carga/exportacion de archivos)

## Backend

Carpeta: `Backend`

### 1) Activar entorno virtual (venv)

```powershell
cd C:\Proyectos\NeuralNet\NeuralReport\Backend

# Si no existe, crearlo:
python -m venv venv

# Activar (tu caso usa carpeta venv)
.\venv\Scripts\Activate.ps1
```

Si PowerShell bloquea scripts:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Verificacion: el prompt debe mostrar `(venv)`.

### 2) Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 3) Configurar `.env` del Backend

Crear/editar `Backend/.env`:

```env
# App
APP_NAME=NeuralReport API
APP_ENV=dev
APP_PORT=8000
DEBUG=true

# Base de datos
DB_HOST=127.0.0.1
DB_PORT=5444
DB_NAME=neuralreport
DB_USER=postgres
DB_PASSWORD=postgres

# MinIO
MINIO_ENDPOINT=127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET_SOURCES=neuralreport-fuentes
MINIO_BUCKET_EXPORTS=neuralreport-exportados

# Vault (opcional)
VAULT_ENABLED=false
VAULT_URL=http://127.0.0.1:8200
VAULT_TOKEN=dev-only-token
VAULT_MOUNT=secret
VAULT_PREFIX=neuralreport
```

### 4) Levantar API en puerto 8000

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Pruebas:

- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

### 5) Alembic (migraciones)

Si te aparece:

`alembic : El termino 'alembic' no se reconoce...`

usa siempre el modulo de Python dentro del `venv`:

```powershell
python -m alembic --version
```

Inicializar Alembic (solo una vez por proyecto):

```powershell
python -m alembic init alembic
```

Nota: en este repo ya existe `alembic.ini`; si ya inicializaste antes, no repitas ese comando.

Configurar URL en `Backend/alembic.ini`:

```ini
sqlalchemy.url = postgresql+psycopg://postgres:postgres@127.0.0.1:5444/neuralreport
```

Crear y aplicar migraciones:

```powershell
python -m alembic revision -m "init"
python -m alembic upgrade head
```

Ver estado actual:

```powershell
python -m alembic current
python -m alembic history
```

## Frontend

Carpeta: `Frontend`

### 1) Instalar dependencias

```powershell
cd C:\Proyectos\NeuralNet\NeuralReport\Frontend
pnpm install
```

### 2) Configurar `.env.local` del Frontend

Crear `Frontend/.env.local`:

```env
# URL del backend para futuras llamadas HTTP desde Next.js
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Nota: el frontend actual funciona mayormente en cliente con calculos locales. Esta variable te deja listo para integrar endpoints del backend.

### 3) Levantar Frontend

```powershell
pnpm dev
```

Abrir: http://127.0.0.1:3000

## Flujo recomendado (dos terminales)

1. Terminal 1 (Backend): activar `venv` y correr `uvicorn` en `8000`.
2. Terminal 2 (Frontend): `pnpm dev` en `3000`.

## Solucion rapida de problemas

- `alembic` no reconocido: usa `python -m alembic ...` con el `venv` activo.
- `ModuleNotFoundError`: reinstala con `pip install -r requirements.txt`.
- Puerto 8000 ocupado: cambia `--port` o libera el proceso.
- Front no conecta a API: revisar `NEXT_PUBLIC_API_URL` y CORS en backend.