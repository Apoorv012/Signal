import secrets
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.clock import utcnow
from app.db.base import Base
from app.db.types import UTCDateTime


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    # NULL for accounts registered with a username instead of a phone number.
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(32), unique=True)
    # Only username accounts have a password (phone accounts sign in with the mocked OTP).
    password_hash: Mapped[str | None] = mapped_column(String(255))
    # SIMULATED end-to-end encryption: a random public "identity key" per user. It only feeds the
    # safety numbers shown in the app; messages are not actually encrypted with it.
    identity_key: Mapped[str | None] = mapped_column(
        String(64), default=lambda: secrets.token_hex(32)
    )
    display_name: Mapped[str] = mapped_column(String(64), default="")
    about: Mapped[str] = mapped_column(String(140), default="")
    avatar_path: Mapped[str | None] = mapped_column(String(255))
    last_seen_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    @property
    def fallback_name(self) -> str:
        """What to show for someone who has not chosen a display name yet."""
        return self.display_name or self.phone or f"@{self.username}"


class AuthSession(Base):
    """A login. Only the token hash is stored; revoking = setting revoked_at (real logout)."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    # "Linked devices" are simply the active logins: each one remembers where it signed in.
    device_name: Mapped[str | None] = mapped_column(String(80))
    last_active_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class Contact(Base):
    """Directional address-book entry: `owner` saved `contact`."""

    __tablename__ = "contacts"

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    contact_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    nickname: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
