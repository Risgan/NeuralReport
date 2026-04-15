from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "NeuralReport"
    app_version: str = "1.0.0"
    debug: bool = True
    app_env: str = "dev"
    app_port: int = 8000

    # Base de datos
    db_host: str
    db_port: int = 5444
    db_name: str
    db_user: str
    db_password: str

    # MinIO
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_secure: bool = False
    minio_bucket_sources: str
    minio_bucket_exports: str

    # Vault
    vault_enabled: bool = False
    vault_url: str | None = None
    vault_token: str | None = None
    vault_mount: str | None = None
    vault_prefix: str | None = None

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()