"""Application settings, loaded from environment variables (or a local .env file)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{(BACKEND_DIR / 'data' / 'signal.db').as_posix()}"
    media_dir: Path = BACKEND_DIR / "data" / "media"
    cors_origins: list[str] = ["http://localhost:3000"]
    # Also allow the dev frontend opened via a LAN address (e.g. from a phone on the same Wi-Fi).
    cors_origin_regex: str = r"http://(127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):3000"
    fixed_otp: str = "123456"  # verification is mocked, see README
    session_ttl_days: int = 30
    seed_on_startup: bool = True
    max_upload_bytes: int = 25 * 1024 * 1024


settings = Settings()
