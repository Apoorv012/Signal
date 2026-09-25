"""Disappearing messages: expired messages are hidden on fetch (see `queries.is_visible`) and, here,
physically deleted by a periodic sweep so they do not linger in the database or on disk."""

import asyncio
import logging
from contextlib import suppress

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import settings
from app.db.session import session_scope
from app.models import Attachment, Message

logger = logging.getLogger(__name__)

SWEEP_INTERVAL_SECONDS = 60


def purge_expired(db: Session) -> int:
    """Deletes messages past their `expires_at` (receipts and reactions cascade), plus the files of
    their attachments. Returns how many messages were removed."""
    now = utcnow()
    ids = list(
        db.scalars(
            select(Message.id).where(Message.expires_at.is_not(None), Message.expires_at <= now)
        )
    )
    if not ids:
        return 0

    files = list(db.scalars(select(Attachment.storage_path).where(Attachment.message_id.in_(ids))))
    db.execute(delete(Attachment).where(Attachment.message_id.in_(ids)))
    db.execute(delete(Message).where(Message.id.in_(ids)))
    db.commit()

    for relative in files:  # the rows are gone; removing the files is best effort
        with suppress(OSError):
            (settings.media_dir / relative).unlink()
    return len(ids)


def _sweep_once() -> int:
    with session_scope() as db:
        return purge_expired(db)


async def sweep_forever() -> None:
    """Background task started with the app: purge every minute, never crash the loop."""
    while True:
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
        try:
            removed = await asyncio.to_thread(_sweep_once)
            if removed:
                logger.info("Removed %d expired messages", removed)
        except Exception:  # noqa: BLE001 - a failed sweep must not stop the next one
            logger.exception("Expired-message sweep failed")
