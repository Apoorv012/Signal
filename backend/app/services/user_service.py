"""Profile, user search and the contact list."""

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import BadRequest, Conflict, NotFound
from app.models import Contact, User
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
        user.username = username
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise Conflict("That username is taken") from None
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
        target = db.scalar(select(User).where(User.username == identifier.lstrip("@")))
    if target is None:
        raise NotFound("No Signal user found with that number or username")
    if target.id == me.id:
        raise BadRequest("You cannot add yourself")
    if db.get(Contact, (me.id, target.id)) is None:
        db.add(Contact(owner_id=me.id, contact_id=target.id))
        db.commit()
    return target


def remove_contact(db: Session, me: User, contact_id: int) -> None:
    contact = db.get(Contact, (me.id, contact_id))
    if contact is not None:
        db.delete(contact)
        db.commit()
