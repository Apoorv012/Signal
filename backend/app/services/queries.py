"""Small reusable queries shared by several services."""

from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import Forbidden, NotFound
from app.models import Conversation, ConversationMember, Message, MessageHidden


def is_visible(viewer_id: int | None = None):
    """SQL condition for messages that should be shown (not deleted, not expired).

    With `viewer_id`, messages that user removed with "Delete for me" are excluded too.
    """
    conditions = [
        Message.deleted_at.is_(None),
        or_(Message.expires_at.is_(None), Message.expires_at > utcnow()),
    ]
    if viewer_id is not None:
        conditions.append(
            ~exists().where(
                MessageHidden.message_id == Message.id, MessageHidden.user_id == viewer_id
            )
        )
    return and_(*conditions)


def history_start(member: ConversationMember):
    """Earliest message time this member may see: they joined, or cleared the chat, later."""
    if member.cleared_at is not None and member.cleared_at > member.joined_at:
        return member.cleared_at
    return member.joined_at


def get_conversation(db: Session, conversation_id: int) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        raise NotFound("Conversation not found")
    return conversation


def get_active_member(db: Session, conversation_id: int, user_id: int) -> ConversationMember | None:
    member = db.get(ConversationMember, (conversation_id, user_id))
    return member if member is not None and member.left_at is None else None


def require_member(db: Session, conversation_id: int, user_id: int) -> ConversationMember:
    """404 for unknown conversations, 403 for non-members (never leaks content)."""
    get_conversation(db, conversation_id)
    member = get_active_member(db, conversation_id, user_id)
    if member is None:
        raise Forbidden("You are not a member of this conversation")
    return member


def active_members(db: Session, conversation_id: int) -> list[ConversationMember]:
    return list(
        db.scalars(
            select(ConversationMember)
            .where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.left_at.is_(None),
            )
            .order_by(ConversationMember.joined_at, ConversationMember.user_id)
        )
    )


def active_member_ids(db: Session, conversation_id: int) -> list[int]:
    return [m.user_id for m in active_members(db, conversation_id)]


def last_message(db: Session, member: ConversationMember) -> Message | None:
    """The newest message this member can see (the conversation list preview)."""
    return db.scalars(
        select(Message)
        .where(
            Message.conversation_id == member.conversation_id,
            Message.created_at >= history_start(member),
            is_visible(member.user_id),
        )
        .order_by(Message.id.desc())
        .limit(1)
    ).first()


def unread_count(db: Session, member: ConversationMember) -> int:
    return (
        db.scalar(
            select(func.count(Message.id)).where(
                Message.conversation_id == member.conversation_id,
                Message.id > (member.last_read_message_id or 0),
                Message.sender_id.is_not(None),
                Message.sender_id != member.user_id,
                Message.created_at >= history_start(member),
                is_visible(member.user_id),
            )
        )
        or 0
    )
