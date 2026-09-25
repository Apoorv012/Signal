"""Delivery / read receipts and the aggregated tick state shown to a message's sender."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.models import ConversationMember, Message, MessageReceipt, MessageStatus
from app.services import queries


def aggregate_status(message: Message) -> MessageStatus:
    """sent -> delivered (every recipient) -> read (every recipient)."""
    receipts = message.receipts
    if not receipts:
        return MessageStatus.SENT
    if all(r.read_at is not None for r in receipts):
        return MessageStatus.READ
    if all(r.delivered_at is not None for r in receipts):
        return MessageStatus.DELIVERED
    return MessageStatus.SENT


def mark_delivered(db: Session, message: Message, user_ids: set[int]) -> bool:
    """Marks `message` delivered for the given recipients. Returns True if anything changed."""
    now = utcnow()
    changed = False
    for receipt in message.receipts:
        if receipt.user_id in user_ids and receipt.delivered_at is None:
            receipt.delivered_at = now
            changed = True
    return changed


def deliver_pending(db: Session, user_id: int) -> list[Message]:
    """User just came online: everything sent to them while offline is now delivered."""
    pending = list(
        db.scalars(
            select(Message)
            .join(MessageReceipt, MessageReceipt.message_id == Message.id)
            .join(
                ConversationMember,
                (ConversationMember.conversation_id == Message.conversation_id)
                & (ConversationMember.user_id == user_id),
            )
            .where(
                MessageReceipt.user_id == user_id,
                MessageReceipt.delivered_at.is_(None),
                ConversationMember.left_at.is_(None),
            )
        )
    )
    now = utcnow()
    for message in pending:
        for receipt in message.receipts:
            if receipt.user_id == user_id:
                receipt.delivered_at = now
    db.commit()
    return pending


def mark_read(
    db: Session, user_id: int, conversation_id: int, up_to_message_id: int
) -> list[Message]:
    """Reader opened the chat: advance their read marker and stamp receipts.

    Returns the messages whose receipts changed, so the caller can notify their senders.
    """
    member = queries.require_member(db, conversation_id, user_id)
    if up_to_message_id > (member.last_read_message_id or 0):
        member.last_read_message_id = up_to_message_id

    unread = list(
        db.scalars(
            select(Message)
            .join(MessageReceipt, MessageReceipt.message_id == Message.id)
            .where(
                Message.conversation_id == conversation_id,
                Message.id <= up_to_message_id,
                MessageReceipt.user_id == user_id,
                MessageReceipt.read_at.is_(None),
            )
        )
    )
    now = utcnow()
    for message in unread:
        for receipt in message.receipts:
            if receipt.user_id == user_id:
                receipt.read_at = now
                receipt.delivered_at = receipt.delivered_at or now
    db.commit()
    return unread
