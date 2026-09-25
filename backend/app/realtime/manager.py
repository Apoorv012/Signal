"""In-memory registry of open WebSockets, keyed by user id.

Single-instance by design (see README): fine for this app, and it keeps the demo dependency-free.
Services are synchronous and run in FastAPI's threadpool, so `dispatch` is thread-safe: it hands
the actual sends to the event loop that owns the sockets.
"""

import asyncio
import logging
from collections import defaultdict
from collections.abc import Mapping
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, user_id: int, websocket: WebSocket) -> bool:
        """Accepts the socket. Returns True if this is the user's first open connection."""
        await websocket.accept()
        self._connections[user_id].add(websocket)
        return len(self._connections[user_id]) == 1

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        """Removes the socket. Returns True if the user has no connections left (went offline)."""
        sockets = self._connections.get(user_id, set())
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(user_id, None)
            return True
        return False

    def is_online(self, user_id: int) -> bool:
        return user_id in self._connections

    def online_user_ids(self) -> set[int]:
        return set(self._connections)

    def dispatch(self, payloads: Mapping[int, dict[str, Any]]) -> None:
        """Send `payloads[user_id]` to every socket of that user. Safe to call from any thread."""
        loop = self._loop
        if loop is None or loop.is_closed() or not payloads:
            return
        asyncio.run_coroutine_threadsafe(self._send_all(dict(payloads)), loop)

    async def _send_all(self, payloads: dict[int, dict[str, Any]]) -> None:
        for user_id, payload in payloads.items():
            for websocket in list(self._connections.get(user_id, ())):
                try:
                    await websocket.send_json(payload)
                except Exception:  # socket died; the receive loop will clean it up
                    logger.debug("dropping dead websocket for user %s", user_id)
                    self._connections[user_id].discard(websocket)


manager = ConnectionManager()
