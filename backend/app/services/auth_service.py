"""Mocked phone authentication: any valid number + the fixed OTP logs you in (registers if new)."""

import re
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import settings
from app.core.errors import BadRequest, Unauthorized
from app.core.security import generate_token, hash_token
from app.models import AuthSession, User
from app.services import conversation_service

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


def verify_otp(db: Session, phone: str, code: str) -> tuple[str, User, bool]:
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

    token = generate_token()
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=utcnow() + timedelta(days=settings.session_ttl_days),
        )
    )
    db.commit()
    return token, user, created or not user.display_name


def user_from_token(db: Session, token: str) -> User:
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None or session.expires_at < utcnow():
        raise Unauthorized("Invalid or expired session")
    user = db.get(User, session.user_id)
    if user is None:
        raise Unauthorized("Invalid or expired session")
    return user


def logout(db: Session, token: str) -> None:
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        db.commit()
