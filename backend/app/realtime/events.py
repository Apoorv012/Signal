"""Names and envelope of server -> client WebSocket events (mirrored in the frontend)."""

from typing import Any

MESSAGE_CREATED = "message.created"
MESSAGE_STATUS = "message.status"  # delivery/read state of a message I sent changed
REACTION_UPDATED = "reaction.updated"
CONVERSATION_UPDATED = "conversation.updated"  # created, renamed, members changed, ...
CONVERSATION_REMOVED = "conversation.removed"  # I was removed from / left a group
TYPING = "typing"
PRESENCE = "presence"


def envelope(event_type: str, data: dict[str, Any]) -> dict[str, Any]:
    return {"type": event_type, "data": data}
