from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel


class UserOut(CamelModel):
    id: int
    phone: str
    username: str | None
    display_name: str
    # False until the onboarding profile step is done (display_name then falls back to the phone).
    has_profile: bool
    about: str
    avatar_url: str | None
    name_color: str
    last_seen_at: datetime | None
    is_online: bool


class ProfileUpdate(CamelModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=64)
    about: str | None = Field(default=None, max_length=140)
    username: str | None = Field(
        default=None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_.]+$"
    )


class ContactCreate(CamelModel):
    """Phone number (+...) or username of a registered user."""

    identifier: str = Field(min_length=3, max_length=40)
