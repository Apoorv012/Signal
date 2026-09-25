"""WebSocket endpoint: server pushes events; the client only sends typing state and pings.

Sending messages stays on REST so it is validated, persisted and idempotent (see README).
"""

import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.concurrency import run_in_threadpool

from app.core.errors import Unauthorized
from app.db.session import session_scope
from app.realtime.manager import manager
from app.services import auth_service, presence_service

logger = logging.getLogger(__name__)
router = APIRouter()

POLICY_VIOLATION = 1008


def _authenticate(token: str) -> int | None:
    with session_scope() as db:
        try:
            return auth_service.user_from_token(db, token).id
        except Unauthorized:
            return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)) -> None:
    user_id = await run_in_threadpool(_authenticate, token)
    if user_id is None:
        await websocket.close(code=POLICY_VIOLATION)
        return

    first_connection = await manager.connect(user_id, websocket)
    if first_connection:
        await run_in_threadpool(presence_service.on_connect, user_id)

    try:
        while True:
            message = await websocket.receive_json()
            kind = message.get("type") if isinstance(message, dict) else None
            if kind == "typing":
                await run_in_threadpool(
                    presence_service.typing,
                    user_id,
                    int(message.get("conversationId", 0)),
                    bool(message.get("isTyping", False)),
                )
            elif kind == "ping":
                await websocket.send_json({"type": "pong", "data": {}})
    except WebSocketDisconnect:
        pass
    except Exception:  # malformed frame etc. — drop the connection, do not crash the server
        logger.exception("websocket error for user %s", user_id)
    finally:
        if manager.disconnect(user_id, websocket):
            await run_in_threadpool(presence_service.on_disconnect, user_id)
