"""SIMULATED end-to-end encryption: safety numbers.

Signal shows a 60-digit "safety number" per one-to-one chat, derived from both people's identity
keys, so they can compare it out of band and be sure nobody sits in the middle. Here the keys are
random values stored on the server and messages are NOT actually encrypted: the numbers only
demonstrate the feature. Both people always see the same number.
"""

import hashlib
import secrets

from sqlalchemy.orm import Session

from app.core.errors import BadRequest
from app.models import ConversationType, User
from app.services import queries


def _peer_of(db: Session, conversation_id: int, me: User) -> User:
    conversation = queries.get_conversation(db, conversation_id)
    queries.require_member(db, conversation_id, me.id)
    if conversation.type != ConversationType.DIRECT:
        raise BadRequest("Safety numbers exist for one-to-one chats only")
    peer_id = next(uid for uid in queries.active_member_ids(db, conversation_id) if uid != me.id)
    peer = db.get(User, peer_id)
    assert peer is not None
    return peer


def _key(db: Session, user: User) -> str:
    """The user's identity key, created on first use for accounts that predate safety numbers."""
    if user.identity_key is None:
        user.identity_key = secrets.token_hex(32)
        db.commit()
    return user.identity_key


def safety_number(key_a: str, key_b: str) -> str:
    """60 digits in 12 groups of 5, identical no matter who computes it."""
    first, second = sorted((key_a, key_b))
    digest = hashlib.sha512(f"{first}:{second}".encode()).digest()
    groups = [int.from_bytes(digest[i * 4 : i * 4 + 4], "big") % 100_000 for i in range(12)]
    return " ".join(f"{group:05d}" for group in groups)


def get_safety_number(db: Session, me: User, conversation_id: int) -> tuple[User, str, bool]:
    peer = _peer_of(db, conversation_id, me)
    member = queries.require_member(db, conversation_id, me.id)
    return peer, safety_number(_key(db, me), _key(db, peer)), member.safety_verified


def set_verified(
    db: Session, me: User, conversation_id: int, verified: bool
) -> tuple[User, str, bool]:
    peer = _peer_of(db, conversation_id, me)
    member = queries.require_member(db, conversation_id, me.id)
    member.safety_verified = verified
    db.commit()
    return peer, safety_number(_key(db, me), _key(db, peer)), verified
