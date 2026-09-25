"""Conversations: direct chats, groups, membership and per-user settings."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import BadRequest, Forbidden, NotFound
from app.models import (
    Conversation,
    ConversationMember,
    ConversationType,
    MemberRole,
    User,
)
from app.realtime import notifier
from app.services import message_service, queries


def _display(user: User) -> str:
    return user.display_name or user.phone


def _timer_label(seconds: int) -> str:
    for unit_seconds, unit in ((86_400, "day"), (3_600, "hour"), (60, "minute")):
        if seconds >= unit_seconds:
            amount = round(seconds / unit_seconds)
            return f"{amount} {unit}{'s' if amount != 1 else ''}"
    return f"{seconds} seconds"


def list_conversations(db: Session, user_id: int) -> list[Conversation]:
    """Conversations the user is in, most recent activity first."""
    return list(
        db.scalars(
            select(Conversation)
            .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
            .where(ConversationMember.user_id == user_id, ConversationMember.left_at.is_(None))
            .order_by(Conversation.last_message_at.desc(), Conversation.id.desc())
        )
    )


def create_note_to_self(db: Session, user: User) -> Conversation:
    conversation = Conversation(type=ConversationType.NOTE_TO_SELF, created_by=user.id)
    conversation.members.append(ConversationMember(user_id=user.id, role=MemberRole.ADMIN))
    db.add(conversation)
    db.flush()
    return conversation


def _find_note_to_self(db: Session, user: User) -> Conversation | None:
    return db.scalar(
        select(Conversation).where(
            Conversation.type == ConversationType.NOTE_TO_SELF, Conversation.created_by == user.id
        )
    )


def create_direct(db: Session, user: User, peer_id: int) -> Conversation:
    """Opens (or creates) the one-to-one chat with `peer_id`. Never creates duplicates."""
    if peer_id == user.id:
        return _find_note_to_self(db, user) or create_note_to_self(db, user)

    peer = db.get(User, peer_id)
    if peer is None:
        raise NotFound("User not found")

    key = f"{min(user.id, peer.id)}:{max(user.id, peer.id)}"
    conversation = db.scalar(select(Conversation).where(Conversation.direct_key == key))
    if conversation is not None:
        for member in conversation.members:
            member.left_at = None
        db.commit()
        return conversation

    conversation = Conversation(type=ConversationType.DIRECT, direct_key=key, created_by=user.id)
    conversation.members.extend(
        [
            ConversationMember(user_id=user.id, role=MemberRole.MEMBER),
            ConversationMember(user_id=peer.id, role=MemberRole.MEMBER),
        ]
    )
    db.add(conversation)
    db.commit()
    notifier.conversation_updated(db, conversation, [peer.id])
    return conversation


def create_group(db: Session, creator: User, title: str, member_ids: list[int]) -> Conversation:
    others = {uid for uid in member_ids if uid != creator.id}
    if not others:
        raise BadRequest("Pick at least one other member")
    found = set(db.scalars(select(User.id).where(User.id.in_(others))))
    if found != others:
        raise NotFound("One or more users were not found")

    conversation = Conversation(
        type=ConversationType.GROUP, title=title.strip(), created_by=creator.id
    )
    conversation.members.append(ConversationMember(user_id=creator.id, role=MemberRole.ADMIN))
    conversation.members.extend(ConversationMember(user_id=uid) for uid in sorted(others))
    db.add(conversation)
    db.commit()
    notifier.conversation_updated(db, conversation)
    return conversation


def _require_admin(db: Session, conversation_id: int, user_id: int) -> ConversationMember:
    member = queries.require_member(db, conversation_id, user_id)
    if member.role != MemberRole.ADMIN:
        raise Forbidden("Only group admins can do that")
    return member


def _require_group(conversation: Conversation) -> None:
    if conversation.type != ConversationType.GROUP:
        raise BadRequest("This is only available for groups")


def update_conversation(
    db: Session,
    actor: User,
    conversation_id: int,
    title: str | None,
    disappearing_seconds: int | None,
) -> Conversation:
    conversation = queries.get_conversation(db, conversation_id)
    queries.require_member(db, conversation_id, actor.id)

    if title is not None:
        _require_group(conversation)
        _require_admin(db, conversation_id, actor.id)
        conversation.title = title.strip()
        db.commit()
        message_service.create_system_message(
            db, conversation, f'{_display(actor)} changed the group name to "{conversation.title}".'
        )

    if disappearing_seconds is not None:
        conversation.disappearing_seconds = disappearing_seconds or None
        db.commit()
        text = (
            f"{_display(actor)} set disappearing message time to "
            f"{_timer_label(disappearing_seconds)}."
            if disappearing_seconds
            else f"{_display(actor)} turned off disappearing messages."
        )
        message_service.create_system_message(db, conversation, text)

    notifier.conversation_updated(db, conversation)
    return conversation


def update_my_settings(
    db: Session,
    user: User,
    conversation_id: int,
    is_pinned: bool | None,
    is_muted: bool | None,
    chat_theme: str | None,
) -> Conversation:
    member = queries.require_member(db, conversation_id, user.id)
    if is_pinned is not None:
        member.is_pinned = is_pinned
    if is_muted is not None:
        member.is_muted = is_muted
    if chat_theme is not None:
        member.chat_theme = chat_theme or None
    db.commit()
    return queries.get_conversation(db, conversation_id)


def add_members(
    db: Session, actor: User, conversation_id: int, user_ids: list[int]
) -> Conversation:
    conversation = queries.get_conversation(db, conversation_id)
    _require_group(conversation)
    _require_admin(db, conversation_id, actor.id)

    added: list[User] = []
    for uid in dict.fromkeys(user_ids):
        user = db.get(User, uid)
        if user is None:
            raise NotFound(f"User {uid} not found")
        member = db.get(ConversationMember, (conversation_id, uid))
        if member is None:
            db.add(ConversationMember(conversation_id=conversation_id, user_id=uid))
        elif member.left_at is not None:  # re-joining resets history visibility
            member.left_at = None
            member.joined_at = utcnow()
            member.role = MemberRole.MEMBER
        else:
            continue
        added.append(user)

    db.commit()
    if added:
        names = ", ".join(_display(u) for u in added)
        message_service.create_system_message(db, conversation, f"{_display(actor)} added {names}.")
        notifier.conversation_updated(db, conversation)
    return conversation


def remove_member(db: Session, actor: User, conversation_id: int, target_id: int) -> Conversation:
    """Admins remove others; anyone can remove themselves (leave)."""
    conversation = queries.get_conversation(db, conversation_id)
    _require_group(conversation)
    queries.require_member(db, conversation_id, actor.id)
    if target_id != actor.id:
        _require_admin(db, conversation_id, actor.id)

    target = queries.get_active_member(db, conversation_id, target_id)
    target_user = db.get(User, target_id)
    if target is None or target_user is None:
        raise NotFound("That user is not in this group")

    target.left_at = utcnow()
    remaining = queries.active_members(db, conversation_id)
    # Never leave a group without an admin: promote the longest-standing member.
    if remaining and not any(m.role == MemberRole.ADMIN for m in remaining):
        remaining[0].role = MemberRole.ADMIN
    db.commit()

    text = (
        f"{_display(actor)} left the group."
        if target_id == actor.id
        else f"{_display(actor)} removed {_display(target_user)}."
    )
    message_service.create_system_message(db, conversation, text)
    notifier.conversation_removed(target_id, conversation_id)
    notifier.conversation_updated(db, conversation)
    return conversation


def set_role(
    db: Session, actor: User, conversation_id: int, target_id: int, role: MemberRole
) -> Conversation:
    conversation = queries.get_conversation(db, conversation_id)
    _require_group(conversation)
    _require_admin(db, conversation_id, actor.id)

    target = queries.get_active_member(db, conversation_id, target_id)
    if target is None:
        raise NotFound("That user is not in this group")
    if role != MemberRole.ADMIN and target.role == MemberRole.ADMIN:
        admins = [
            m for m in queries.active_members(db, conversation_id) if m.role == MemberRole.ADMIN
        ]
        if len(admins) == 1:
            raise BadRequest("A group needs at least one admin")
    target.role = role
    db.commit()
    notifier.conversation_updated(db, conversation)
    return conversation
