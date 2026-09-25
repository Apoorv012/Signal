"""Authentication.

Phone accounts: any valid number + the fixed OTP logs you in (registers if new; mocked check).
Username accounts: a unique username + password (registered explicitly, then used to log in).
"""

import re
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import settings
from app.core.errors import BadRequest, Conflict, Unauthorized
from app.core.security import generate_token, hash_password, hash_token, verify_password
from app.models import AuthSession, User
from app.services import conversation_service

ACTIVITY_WRITE_GAP = timedelta(seconds=60)
_PHONE_RE = re.compile(r"^\+\d{7,15}$")  # E.164: "+", country code, number


def normalize_phone(raw: str) -> str:
    """ "+1 (555) 123-4567" -> "+15551234567"."""
    cleaned = re.sub(r"[\s\-().]", "", raw)
    if not cleaned.startswith("+"):
        # Never guess a country code: "5550000001" is not "+5550000001".
        raise BadRequest("Include the country code, e.g. +1 555 123 4567")
    if not _PHONE_RE.match(cleaned):
        raise BadRequest("Enter a valid phone number, e.g. +1 555 123 4567")
    return cleaned


def verify_otp(
    db: Session, phone: str, code: str, device_name: str | None = None
) -> tuple[str, User, bool]:
    """Returns (token, user, needs_profile): needs_profile is True until a name has been set."""
    normalized = normalize_phone(phone)
    if code != settings.fixed_otp:
        raise BadRequest("That code is incorrect")

    user = db.scalar(select(User).where(User.phone == normalized))
    created = user is None
    if user is None:
        user = User(phone=normalized)
        db.add(user)
        db.flush()
        conversation_service.create_note_to_self(db, user)

    token = _start_session(db, user, device_name)
    return token, user, created or not user.display_name


def find_by_username(db: Session, username: str) -> User | None:
    """Usernames are unique regardless of case ("Maya" and "maya" are the same person)."""
    return db.scalar(select(User).where(func.lower(User.username) == username.strip().lower()))


def register_username(
    db: Session, username: str, password: str, device_name: str | None = None
) -> tuple[str, User]:
    """Creates a username + password account and signs it in (it still has to pick a name)."""
    if find_by_username(db, username) is not None:
        raise Conflict("That username is taken")
    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    db.flush()
    conversation_service.create_note_to_self(db, user)
    return _start_session(db, user, device_name), user


def login_username(
    db: Session, username: str, password: str, device_name: str | None = None
) -> tuple[str, User]:
    user = find_by_username(db, username)
    # One message for "no such user" and "wrong password", so usernames cannot be probed.
    if user is None or not user.password_hash or not verify_password(password, user.password_hash):
        raise BadRequest("Incorrect username or password")
    return _start_session(db, user, device_name), user


def _start_session(db: Session, user: User, device_name: str | None = None) -> str:
    token = generate_token()
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utcnow() + timedelta(days=settings.session_ttl_days),
            device_name=device_name,
            last_active_at=utcnow(),
        )
    )
    db.commit()
    return token


def user_from_token(db: Session, token: str) -> User:
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None or session.expires_at < utcnow():
        raise Unauthorized("Invalid or expired session")
    user = db.get(User, session.user_id)
    if user is None:
        raise Unauthorized("Invalid or expired session")
    # Keep "last active" fresh for the linked-devices list without writing on every request.
    if session.last_active_at is None or utcnow() - session.last_active_at > ACTIVITY_WRITE_GAP:
        session.last_active_at = utcnow()
        db.commit()
    return user


def logout(db: Session, token: str) -> None:
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        db.commit()
