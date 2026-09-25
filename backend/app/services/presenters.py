"""Builds API DTOs from ORM objects, from the point of view of the requesting ("viewer") user.

Kept separate from services so business rules and response shaping do not mix.
"""

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models import Attachment, Conversation, ConversationType, Message, MessageKind, User
from app.realtime.manager import manager
from app.schemas.conversation import ConversationOut, LastMessageOut, MemberOut, ThemeOut
from app.schemas.message import AttachmentOut, MessageOut, QuotedMessageOut, ReactionOut
from app.schemas.user import UserOut
from app.services import queries
from app.services.receipts import aggregate_status

NAME_COLORS = [
    "#2c6bed",
    "#c2185b",
    "#2e7d32",
    "#7b3fe4",
    "#ef6c00",
    "#00838f",
    "#8a5a14",
    "#c8102e",
]

# Preset chat themes a member can pick per conversation (MySettingsIn.chat_theme).
THEMES: dict[str, ThemeOut] = {
    "crimson": ThemeOut(bubble_background="#cf163f"),
    "soup": ThemeOut(
        bubble_background="linear-gradient(180deg, #677ccb 0%, #885681 100%)",
        wallpaper="linear-gradient(180deg, #d8dcf4 0%, #d6a8ba 100%)",
    ),
    "forest": ThemeOut(bubble_background="#2e7d32"),
    "violet": ThemeOut(bubble_background="#6a3fe0"),
}


def media_url(path: str | None) -> str | None:
    return f"/media/{path}" if path else None


def size_label(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes}B"
    if size_bytes < 1024 * 1024:
        return f"{round(size_bytes / 1024)}KB"
    return f"{size_bytes / (1024 * 1024):.1f}MB"


def user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        phone=user.phone,
        username=user.username,
        display_name=user.display_name or user.phone,
        has_profile=bool(user.display_name),
        about=user.about,
        avatar_url=media_url(user.avatar_path),
        name_color=NAME_COLORS[user.id % len(NAME_COLORS)],
        last_seen_at=user.last_seen_at,
        is_online=manager.is_online(user.id),
    )


def attachment_out(attachment: Attachment) -> AttachmentOut:
    return AttachmentOut(
        id=attachment.id,
        url=media_url(attachment.storage_path) or "",
        file_name=attachment.file_name,
        mime_type=attachment.mime_type,
        size_bytes=attachment.size_bytes,
        size_label=size_label(attachment.size_bytes),
        width=attachment.width,
        height=attachment.height,
        duration_sec=attachment.duration_sec,
    )


def preview_text(message: Message) -> str:
    """One-line description used for reply quotes and the conversation list."""
    if message.kind == MessageKind.VOICE:
        return "Voice Message"
    if message.kind == MessageKind.FILE:
        return "File"
    if message.kind == MessageKind.IMAGE:
        return message.body or "Photo"
    return message.body


def _sender_name(db: Session, message: Message) -> str:
    sender = db.get(User, message.sender_id) if message.sender_id else None
    return (sender.display_name or sender.phone) if sender else "Signal"


def message_out(db: Session, message: Message, viewer_id: int) -> MessageOut:
    quote = None
    if message.reply_to is not None:
        quote = QuotedMessageOut(
            id=message.reply_to.id,
            sender_name=_sender_name(db, message.reply_to),
            preview=preview_text(message.reply_to)[:100],
        )

    grouped: dict[str, list[int]] = defaultdict(list)
    for reaction in sorted(message.reactions, key=lambda r: r.created_at):
        grouped[reaction.emoji].append(reaction.user_id)

    own = message.sender_id == viewer_id
    return MessageOut(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        kind=message.kind,
        body=message.body,
        created_at=message.created_at,
        expires_at=message.expires_at,
        status=aggregate_status(message) if own else "sent",
        client_id=message.client_id if own else None,
        attachment=attachment_out(message.attachment) if message.attachment else None,
        reply_to=quote,
        reactions=[
            ReactionOut(emoji=emoji, count=len(users), reacted_by_me=viewer_id in users)
            for emoji, users in grouped.items()
        ],
    )


def _conversation_title_and_avatar(
    conversation: Conversation, members: list[User], viewer_id: int
) -> tuple[str, str | None]:
    if conversation.type == ConversationType.NOTE_TO_SELF:
        return "Note to Self", None
    if conversation.type == ConversationType.DIRECT:
        peer = next((u for u in members if u.id != viewer_id), members[0])
        return peer.display_name or peer.phone, media_url(peer.avatar_path)
    return conversation.title or "Group", media_url(conversation.avatar_path)


def conversation_out(db: Session, conversation: Conversation, viewer_id: int) -> ConversationOut:
    member_rows = queries.active_members(db, conversation.id)
    me = next(m for m in member_rows if m.user_id == viewer_id)
    users = [db.get(User, m.user_id) for m in member_rows]
    title, avatar_url = _conversation_title_and_avatar(conversation, users, viewer_id)

    last = queries.last_message(db, conversation.id)
    last_out = None
    if last is not None:
        sender_name = None
        if conversation.type == ConversationType.GROUP and last.sender_id not in (None, viewer_id):
            sender_name = _sender_name(db, last).split()[0]
        last_out = LastMessageOut(
            kind=last.kind,
            text=preview_text(last),
            sender_name=sender_name,
            created_at=last.created_at,
            status=aggregate_status(last) if last.sender_id == viewer_id else None,
        )

    return ConversationOut(
        id=conversation.id,
        type=conversation.type,
        title=title,
        avatar_url=avatar_url,
        is_pinned=me.is_pinned,
        is_muted=me.is_muted,
        unread_count=queries.unread_count(db, me),
        last_activity_at=conversation.last_message_at,
        last_message=last_out,
        disappearing_seconds=conversation.disappearing_seconds,
        theme=THEMES.get(me.chat_theme or ""),
        members=[
            MemberOut(user=user_out(u), role=m.role)
            for m, u in zip(member_rows, users, strict=True)
        ],
        my_role=me.role,
    )
