"""FastAPI application factory."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import app.models  # noqa: F401  (registers models on Base.metadata)
from app.api.router import api_router
from app.api.routes import ws
from app.core.config import settings
from app.core.errors import AppError
from app.db.base import Base
from app.db.columns import add_missing_columns
from app.db.session import engine, session_scope
from app.realtime.manager import manager
from app.services import expiry_service, user_service

logger = logging.getLogger(__name__)


def init_storage() -> None:
    """Creates the media folder, the SQLite folder and any missing tables."""
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    if engine.url.get_backend_name() == "sqlite" and engine.url.database:
        from pathlib import Path

        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
    add_missing_columns(engine)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_storage()
    manager.bind_loop(asyncio.get_running_loop())
    if settings.seed_on_startup:
        from app.seed.seed import seed_if_empty

        seed_if_empty()
    with session_scope() as db:
        user_service.backfill_identity_keys(db)
        user_service.backfill_direct_contacts(db)
    sweeper = asyncio.create_task(expiry_service.sweep_forever())
    try:
        yield
    finally:
        sweeper.cancel()


def create_app() -> FastAPI:
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    app = FastAPI(title="Signal Clone API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, error: AppError) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content={"detail": error.detail})

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router)
    app.include_router(ws.router)
    app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")
    return app


app = create_app()
