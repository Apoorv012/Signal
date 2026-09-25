from datetime import datetime

from pydantic import Field

from app.models.enums import MessageKind, MessageStatus
from app.schemas.common import CamelModel


class AttachmentOut(CamelModel):
    id: int
    url: str
    file_name: str
    mime_type: str
    size_bytes: int
    size_label: str
    width: int | None
    height: int | None
    duration_sec: int | None


class QuotedMessageOut(CamelModel):
    id: int
    sender_name: str
    preview: str


class ReactionOut(CamelModel):
    """Reactions of one emoji, aggregated for the viewing user."""

    emoji: str
    count: int
    reacted_by_me: bool


class MessageOut(CamelModel):
    id: int
    conversation_id: int
    sender_id: int | None
    kind: MessageKind
    body: str
    created_at: datetime
    expires_at: datetime | None
    status: MessageStatus
    client_id: str | None
    attachment: AttachmentOut | None
    reply_to: QuotedMessageOut | None
    reactions: list[ReactionOut]


class SendMessageIn(CamelModel):
    client_id: str = Field(min_length=1, max_length=64)
    body: str = Field(default="", max_length=5000)
    reply_to_id: int | None = None
    attachment_id: int | None = None


class DeleteMessagesIn(CamelModel):
    message_ids: list[int] = Field(min_length=1, max_length=100)
    for_everyone: bool = False


class ReactionIn(CamelModel):
    emoji: str = Field(min_length=1, max_length=16)


class ReadIn(CamelModel):
    up_to_message_id: int
