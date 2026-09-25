"""Application settings, loaded from environment variables (or a local .env file)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{BACKEND_DIR / 'data' / 'signal.db'}"
    media_dir: Path = BACKEND_DIR / "data" / "media"
    cors_origins: list[str] = ["http://localhost:3000"]
    fixed_otp: str = "123456"  # verification is mocked, see README
    session_ttl_days: int = 30
    seed_on_startup: bool = True


settings = Settings()
