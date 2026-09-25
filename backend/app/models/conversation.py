from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime
from app.models.enums import ConversationType, MemberRole


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ConversationType] = mapped_column(
        Enum(
            ConversationType,
            native_enum=False,
            length=16,
            values_callable=lambda e: [m.value for m in e],
        )
    )
    title: Mapped[str | None] = mapped_column(String(100))
    avatar_path: Mapped[str | None] = mapped_column(String(255))
    # "minId:maxId" for direct chats: the UNIQUE constraint makes duplicate DMs impossible.
    direct_key: Mapped[str | None] = mapped_column(String(40), unique=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    disappearing_seconds: Mapped[int | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    # Denormalised so the conversation list can be sorted without scanning messages.
    last_message_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, index=True)

    members: Mapped[list["ConversationMember"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class ConversationMember(Base):
    """Membership plus this user's private state for the conversation."""

    __tablename__ = "conversation_members"

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    role: Mapped[MemberRole] = mapped_column(
        Enum(
            MemberRole, native_enum=False, length=8, values_callable=lambda e: [m.value for m in e]
        ),
        default=MemberRole.MEMBER,
    )
    joined_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    left_at: Mapped[datetime | None] = mapped_column(UTCDateTime)  # set when removed / left
    # Unread = messages from others with id > this. Plain int (no FK) to avoid a circular FK.
    last_read_message_id: Mapped[int | None] = mapped_column()
    is_pinned: Mapped[bool] = mapped_column(default=False)
    is_muted: Mapped[bool] = mapped_column(default=False)
    chat_theme: Mapped[str | None] = mapped_column(String(24))
    # "Clear messages": history before this moment is hidden from this user only.
    cleared_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    marked_unread: Mapped[bool] = mapped_column(default=False)
    # The user compared the (simulated) safety number with the other person and confirmed it.
    safety_verified: Mapped[bool] = mapped_column(default=False)

    conversation: Mapped[Conversation] = relationship(back_populates="members")
