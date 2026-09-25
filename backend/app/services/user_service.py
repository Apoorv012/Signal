"""Profile, user search and the contact list."""

from sqlalchemy import exists, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import BadRequest, Conflict, NotFound
from app.core.security import hash_password, verify_password
from app.models import Contact, Conversation, ConversationType, Message, User
from app.services import auth_service, media

AVATAR_MAX_BYTES = 5 * 1024 * 1024


def update_profile(
    db: Session,
    user: User,
    display_name: str | None,
    about: str | None,
    username: str | None,
) -> User:
    if display_name is not None:
        user.display_name = display_name.strip()
    if about is not None:
        user.about = about
    if username is not None:
        taken = auth_service.find_by_username(db, username)
        if taken is not None and taken.id != user.id:
            raise Conflict("That username is taken")
        user.username = username
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise Conflict("That username is taken") from None
    return user


def attach_phone(db: Session, user: User, phone: str, code: str) -> User:
    """Adds (or changes) the phone number on this account after the (mocked) OTP check.

    Two existing accounts are never merged: a number that already belongs to another account is
    refused, so the person has to pick which account to keep.
    """
    normalized = auth_service.normalize_phone(phone)
    if code != settings.fixed_otp:
        raise BadRequest("That code is incorrect")
    owner = db.scalar(select(User).where(User.phone == normalized))
    if owner is not None and owner.id != user.id:
        raise Conflict("That number already belongs to another account")
    user.phone = normalized
    db.commit()
    return user


def set_password(db: Session, user: User, password: str, current_password: str | None) -> User:
    """Sets or changes the password used for username login (needs a username first)."""
    if not user.username:
        raise BadRequest("Choose a username first")
    if user.password_hash is not None and (
        not current_password or not verify_password(current_password, user.password_hash)
    ):
        raise BadRequest("Your current password is incorrect")
    user.password_hash = hash_password(password)
    db.commit()
    return user


def set_avatar(db: Session, user: User, file_name: str, data: bytes) -> User:
    if len(data) > AVATAR_MAX_BYTES:
        raise BadRequest("Profile photo is too large (max 5 MB)")
    if media.image_size(data) is None:
        raise BadRequest("Profile photo must be an image")
    user.avatar_path = media.save_bytes("avatars", file_name, data)
    db.commit()
    return user


def search_users(db: Session, me: User, query: str, limit: int = 20) -> list[User]:
    """Finds registered users by name, username or phone (used by "New message")."""
    term = query.strip().lstrip("@")
    if len(term) < 2:
        return []
    pattern = f"%{term}%"
    return list(
        db.scalars(
            select(User)
            .where(
                User.id != me.id,
                or_(
                    User.display_name.ilike(pattern),
                    User.username.ilike(pattern),
                    User.phone.like(f"%{term.replace(' ', '')}%"),
                ),
            )
            .order_by(User.display_name)
            .limit(limit)
        )
    )


def list_contacts(db: Session, me: User) -> list[User]:
    return list(
        db.scalars(
            select(User)
            .join(Contact, Contact.contact_id == User.id)
            .where(Contact.owner_id == me.id)
            .order_by(User.display_name)
        )
    )


def add_contact(db: Session, me: User, identifier: str) -> User:
    """Adds a registered user by phone number or @username. Adding twice is a no-op."""
    identifier = identifier.strip()
    if identifier.startswith("+"):
        target = db.scalar(
            select(User).where(User.phone == auth_service.normalize_phone(identifier))
        )
    else:
        target = auth_service.find_by_username(db, identifier.lstrip("@"))
    if target is None:
        raise NotFound("No Signal user found with that number or username")
    if target.id == me.id:
        raise BadRequest("You cannot add yourself")
    if db.get(Contact, (me.id, target.id)) is None:
        db.add(Contact(owner_id=me.id, contact_id=target.id))
        db.commit()
    return target


def ensure_contact(db: Session, owner_id: int, contact_id: int) -> None:
    """Saves `contact_id` in `owner_id`'s address book if missing (the caller commits)."""
    if owner_id != contact_id and db.get(Contact, (owner_id, contact_id)) is None:
        db.add(Contact(owner_id=owner_id, contact_id=contact_id))


def link_contacts(db: Session, user_a: int, user_b: int) -> None:
    """Two people who have exchanged messages know each other: save each in the other's contacts."""
    ensure_contact(db, user_a, user_b)
    ensure_contact(db, user_b, user_a)


def backfill_identity_keys(db: Session) -> None:
    """Users created before safety numbers existed get their (simulated) identity key."""
    import secrets

    for user in db.scalars(select(User).where(User.identity_key.is_(None))):
        user.identity_key = secrets.token_hex(32)
    db.commit()


def backfill_direct_contacts(db: Session) -> None:
    """One-off catch-up at startup for chats that predate `link_contacts`. Safe to repeat."""
    has_messages = exists().where(Message.conversation_id == Conversation.id)
    chats = db.scalars(
        select(Conversation).where(Conversation.type == ConversationType.DIRECT, has_messages)
    )
    for chat in chats:
        ids = [member.user_id for member in chat.members]
        if len(ids) == 2:
            link_contacts(db, ids[0], ids[1])
    db.commit()


def remove_contact(db: Session, me: User, contact_id: int) -> None:
    contact = db.get(Contact, (me.id, contact_id))
    if contact is not None:
        db.delete(contact)
        db.commit()
