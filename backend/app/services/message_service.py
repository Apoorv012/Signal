"""Sending, listing and reacting to messages."""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import BadRequest, NotFound
from app.models import (
    Conversation,
    ConversationType,
    Message,
    MessageKind,
    MessageReceipt,
    Reaction,
    User,
)
from app.realtime import notifier
from app.realtime.manager import manager
from app.services import attachment_service, queries, receipts


def _kind_for(mime_type: str) -> MessageKind:
    if mime_type.startswith("image/"):
        return MessageKind.IMAGE
    if mime_type.startswith("audio/"):
        return MessageKind.VOICE
    return MessageKind.FILE


def get_message(db: Session, message_id: int) -> Message:
    message = db.get(Message, message_id)
    if message is None or message.deleted_at is not None:
        raise NotFound("Message not found")
    return message


def send_message(
    db: Session,
    sender: User,
    conversation_id: int,
    client_id: str,
    body: str,
    reply_to_id: int | None = None,
    attachment_id: int | None = None,
) -> Message:
    """Persists a message, creates receipts, marks it delivered to online members, and pushes it.

    Idempotent on (sender, client_id): a retried request returns the original message.
    """
    conversation = queries.get_conversation(db, conversation_id)
    queries.require_member(db, conversation_id, sender.id)

    existing = db.scalar(
        select(Message).where(Message.sender_id == sender.id, Message.client_id == client_id)
    )
    if existing is not None:
        return existing

    body = body.strip()
    attachment = (
        attachment_service.get_unattached(db, sender, attachment_id) if attachment_id else None
    )
    if not body and attachment is None:
        raise BadRequest("A message needs text or an attachment")

    if reply_to_id is not None:
        quoted = db.get(Message, reply_to_id)
        if quoted is None or quoted.conversation_id != conversation_id:
            raise BadRequest("The quoted message is not in this conversation")

    now = utcnow()
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender.id,
        kind=_kind_for(attachment.mime_type) if attachment else MessageKind.TEXT,
        body=body,
        reply_to_id=reply_to_id,
        client_id=client_id,
        created_at=now,
        expires_at=(
            now + timedelta(seconds=conversation.disappearing_seconds)
            if conversation.disappearing_seconds
            else None
        ),
    )
    db.add(message)
    try:
        db.flush()
    except IntegrityError:  # lost a race with a concurrent retry of the same client_id
        db.rollback()
        return db.scalars(
            select(Message).where(Message.sender_id == sender.id, Message.client_id == client_id)
        ).one()

    if attachment is not None:
        attachment.message_id = message.id

    recipients = [uid for uid in queries.active_member_ids(db, conversation_id) if uid != sender.id]
    for user_id in recipients:
        db.add(MessageReceipt(message_id=message.id, user_id=user_id))
    db.flush()
    db.refresh(message)

    conversation.last_message_at = now
    sender_member = queries.require_member(db, conversation_id, sender.id)
    sender_member.last_read_message_id = message.id  # your own message is never "unread" to you

    delivered = receipts.mark_delivered(db, message, manager.online_user_ids())
    db.commit()

    if conversation.type == ConversationType.DIRECT and _is_first_message(db, message):
        # The chat has been invisible to the other person until now: introduce it first.
        notifier.conversation_updated(db, conversation)
    notifier.message_created(db, message)
    if delivered:
        notifier.message_status(message)
    return message


def _is_first_message(db: Session, message: Message) -> bool:
    earlier = db.scalar(
        select(Message.id)
        .where(Message.conversation_id == message.conversation_id, Message.id < message.id)
        .limit(1)
    )
    return earlier is None


def create_system_message(db: Session, conversation: Conversation, body: str) -> Message:
    """Centered event line ("Maya set disappearing message time to 1 day.")."""
    message = Message(
        conversation_id=conversation.id,
        sender_id=None,
        kind=MessageKind.SYSTEM,
        body=body,
        created_at=utcnow(),
    )
    db.add(message)
    conversation.last_message_at = message.created_at
    db.commit()
    notifier.message_created(db, message)
    return message


def list_messages(
    db: Session, user: User, conversation_id: int, before_id: int | None, limit: int
) -> list[Message]:
    """Newest-first paging (`before_id` cursor), returned oldest-first for rendering."""
    member = queries.require_member(db, conversation_id, user.id)
    stmt = select(Message).where(
        Message.conversation_id == conversation_id,
        Message.created_at >= member.joined_at,  # new members do not see earlier history
        queries.is_visible(),
    )
    if before_id is not None:
        stmt = stmt.where(Message.id < before_id)
    page = list(db.scalars(stmt.order_by(Message.id.desc()).limit(limit)))
    page.reverse()
    return page


def mark_conversation_read(
    db: Session, user: User, conversation_id: int, up_to_message_id: int
) -> None:
    """Advance the read marker and tell the senders their messages were read."""
    notifier.messages_status(receipts.mark_read(db, user.id, conversation_id, up_to_message_id))


def set_reaction(db: Session, user: User, message_id: int, emoji: str) -> Message:
    message = get_message(db, message_id)
    queries.require_member(db, message.conversation_id, user.id)
    reaction = db.get(Reaction, (message_id, user.id))
    if reaction is None:
        db.add(Reaction(message_id=message_id, user_id=user.id, emoji=emoji))
    else:
        reaction.emoji = emoji
    db.commit()
    db.refresh(message)
    notifier.reaction_updated(db, message)
    return message


def remove_reaction(db: Session, user: User, message_id: int) -> Message:
    message = get_message(db, message_id)
    queries.require_member(db, message.conversation_id, user.id)
    reaction = db.get(Reaction, (message_id, user.id))
    if reaction is not None:
        db.delete(reaction)
        db.commit()
        db.refresh(message)
        notifier.reaction_updated(db, message)
    return message
