"""Linked devices = the account's active logins (sessions), with a friendly name for each."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.errors import BadRequest, NotFound
from app.core.security import hash_token
from app.models import AuthSession, User

_BROWSERS = [("Edg/", "Edge"), ("OPR/", "Opera"), ("Firefox/", "Firefox"), ("Chrome/", "Chrome")]
# iPhone user agents also say "Mac OS X", so the more specific names come first.
_SYSTEMS = [
    ("iPhone", "iPhone"),
    ("iPad", "iPad"),
    ("Android", "Android"),
    ("Windows", "Windows"),
    ("Mac OS X", "macOS"),
    ("Linux", "Linux"),
]


def describe_device(user_agent: str | None) -> str:
    """ "Mozilla/5.0 (Windows NT 10.0) ... Chrome/120" -> "Chrome on Windows"."""
    if not user_agent:
        return "Unknown device"
    browser = next((name for key, name in _BROWSERS if key in user_agent), None)
    if browser is None and "Safari/" in user_agent:
        browser = "Safari"
    system = next((name for key, name in _SYSTEMS if key in user_agent), "an unknown system")
    return f"{browser or 'Browser'} on {system}"


def list_devices(db: Session, user: User) -> list[AuthSession]:
    now = utcnow()
    return list(
        db.scalars(
            select(AuthSession)
            .where(
                AuthSession.user_id == user.id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .order_by(AuthSession.created_at.desc())
        )
    )


def unlink(db: Session, user: User, session_id: int, current_token: str) -> None:
    session = db.get(AuthSession, session_id)
    if session is None or session.user_id != user.id or session.revoked_at is not None:
        raise NotFound("Device not found")
    if session.token_hash == hash_token(current_token):
        raise BadRequest("This is the device you are using. Use Log out instead.")
    session.revoked_at = utcnow()
    db.commit()
