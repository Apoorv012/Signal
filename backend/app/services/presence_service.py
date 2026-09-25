"""Online status and typing indicators (driven by the WebSocket connection lifecycle)."""

from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.core.clock import utcnow
from app.db.session import session_scope
from app.models import ConversationMember, User
from app.realtime import notifier
from app.services import queries, receipts


def _peer_ids(db: Session, user_id: int) -> set[int]:
    """Everyone who shares at least one active conversation with the user."""
    mine = aliased(ConversationMember)
    theirs = aliased(ConversationMember)
    rows = db.scalars(
        select(theirs.user_id)
        .join(mine, mine.conversation_id == theirs.conversation_id)
        .where(
            mine.user_id == user_id,
            mine.left_at.is_(None),
            theirs.left_at.is_(None),
            theirs.user_id != user_id,
        )
        .distinct()
    )
    return set(rows)


def on_connect(user_id: int) -> None:
    """First socket opened: deliver what was sent while offline, announce presence."""
    with session_scope() as db:
        delivered = receipts.deliver_pending(db, user_id)
        notifier.messages_status(delivered)
        user = db.get(User, user_id)
        if user is not None:
            notifier.presence(user, True, _peer_ids(db, user_id))


def on_disconnect(user_id: int) -> None:
    """Last socket closed: remember last-seen and announce offline."""
    with session_scope() as db:
        user = db.get(User, user_id)
        if user is None:
            return
        user.last_seen_at = utcnow()
        db.commit()
        notifier.presence(user, False, _peer_ids(db, user_id))


def typing(user_id: int, conversation_id: int, is_typing: bool) -> None:
    with session_scope() as db:
        if queries.get_active_member(db, conversation_id, user_id) is None:
            return  # silently ignore typing for conversations the user is not in
        notifier.typing(
            conversation_id, user_id, is_typing, queries.active_member_ids(db, conversation_id)
        )
