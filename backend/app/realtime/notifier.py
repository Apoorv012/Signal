"""Turns domain changes into WebSocket events.

Payloads are built per recipient because DTOs are viewer-specific (e.g. `reactedByMe`, unread).
"""

from collections.abc import Iterable

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.models import Conversation, Message, User
from app.realtime import events
from app.realtime.manager import manager
from app.services import presenters, queries
from app.services.receipts import aggregate_status


def _dump(model: BaseModel) -> dict:
    return model.model_dump(by_alias=True, mode="json")


def message_created(db: Session, message: Message) -> None:
    recipients = queries.active_member_ids(db, message.conversation_id)
    manager.dispatch(
        {
            uid: events.envelope(
                events.MESSAGE_CREATED, _dump(presenters.message_out(db, message, uid))
            )
            for uid in recipients
        }
    )


def message_status(message: Message) -> None:
    """Tell the sender their message's tick state changed."""
    if message.sender_id is None:
        return
    manager.dispatch(
        {
            message.sender_id: events.envelope(
                events.MESSAGE_STATUS,
                {
                    "messageId": message.id,
                    "conversationId": message.conversation_id,
                    "status": aggregate_status(message).value,
                },
            )
        }
    )


def messages_status(messages: Iterable[Message]) -> None:
    for message in messages:
        message_status(message)


def reaction_updated(db: Session, message: Message) -> None:
    recipients = queries.active_member_ids(db, message.conversation_id)
    manager.dispatch(
        {
            uid: events.envelope(
                events.REACTION_UPDATED,
                {
                    "messageId": message.id,
                    "conversationId": message.conversation_id,
                    "reactions": [
                        _dump(r) for r in presenters.message_out(db, message, uid).reactions
                    ],
                },
            )
            for uid in recipients
        }
    )


def messages_deleted(db: Session, messages: Iterable[Message]) -> None:
    """Tell every member which messages vanished, then refresh their list previews."""
    by_conversation: dict[int, list[int]] = {}
    for message in messages:
        by_conversation.setdefault(message.conversation_id, []).append(message.id)
    for conversation_id, message_ids in by_conversation.items():
        payload = events.envelope(
            events.MESSAGE_DELETED, {"conversationId": conversation_id, "messageIds": message_ids}
        )
        recipients = queries.active_member_ids(db, conversation_id)
        manager.dispatch({uid: payload for uid in recipients})
        conversation_updated(db, queries.get_conversation(db, conversation_id))


def conversation_updated(
    db: Session, conversation: Conversation, user_ids: Iterable[int] | None = None
) -> None:
    targets = (
        list(user_ids) if user_ids is not None else queries.active_member_ids(db, conversation.id)
    )
    manager.dispatch(
        {
            uid: events.envelope(
                events.CONVERSATION_UPDATED,
                _dump(presenters.conversation_out(db, conversation, uid)),
            )
            for uid in targets
        }
    )


def conversation_removed(user_id: int, conversation_id: int) -> None:
    manager.dispatch(
        {user_id: events.envelope(events.CONVERSATION_REMOVED, {"conversationId": conversation_id})}
    )


def typing(conversation_id: int, user_id: int, is_typing: bool, recipients: Iterable[int]) -> None:
    payload = events.envelope(
        events.TYPING,
        {"conversationId": conversation_id, "userId": user_id, "isTyping": is_typing},
    )
    manager.dispatch({uid: payload for uid in recipients if uid != user_id})


def presence(user: User, online: bool, recipients: Iterable[int]) -> None:
    payload = events.envelope(
        events.PRESENCE,
        {
            "userId": user.id,
            "isOnline": online,
            "lastSeenAt": (user.last_seen_at or utcnow()).isoformat(),
        },
    )
    manager.dispatch({uid: payload for uid in recipients if uid != user.id})
