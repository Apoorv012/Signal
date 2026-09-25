from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime
from app.models.enums import MessageKind


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        # Newest-first paging within a conversation.
        Index("ix_messages_conversation_id_id", "conversation_id", "id"),
        # Idempotent sends: a retried request with the same client_id returns the same message.
        UniqueConstraint("sender_id", "client_id", name="uq_messages_sender_client"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"))
    sender_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    kind: Mapped[MessageKind] = mapped_column(
        Enum(
            MessageKind, native_enum=False, length=8, values_callable=lambda e: [m.value for m in e]
        ),
        default=MessageKind.TEXT,
    )
    body: Mapped[str] = mapped_column(Text, default="")
    reply_to_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id", ondelete="SET NULL"))
    client_id: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(UTCDateTime)  # disappearing messages
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime)

    reply_to: Mapped["Message | None"] = relationship(remote_side="Message.id")
    attachment: Mapped["Attachment | None"] = relationship(back_populates="message", uselist=False)
    receipts: Mapped[list["MessageReceipt"]] = relationship(cascade="all, delete-orphan")
    reactions: Mapped[list["Reaction"]] = relationship(cascade="all, delete-orphan")


class MessageReceipt(Base):
    """One row per (message, recipient). The sender's tick state is aggregated from these."""

    __tablename__ = "message_receipts"

    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    read_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class Reaction(Base):
    """Signal allows one reaction per user per message (re-reacting replaces the emoji)."""

    __tablename__ = "reactions"

    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    emoji: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)


class Attachment(Base):
    """Uploaded first (message_id NULL), then attached when the message is sent."""

    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    uploader_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    message_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), unique=True
    )
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column()
    storage_path: Mapped[str] = mapped_column(String(255))  # relative to MEDIA_DIR
    width: Mapped[int | None] = mapped_column()
    height: Mapped[int | None] = mapped_column()
    duration_sec: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    message: Mapped[Message | None] = relationship(back_populates="attachment")
