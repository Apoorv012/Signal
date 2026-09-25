from datetime import datetime

from pydantic import Field

from app.models.enums import ConversationType, MemberRole, MessageKind, MessageStatus
from app.schemas.common import CamelModel
from app.schemas.user import UserOut


class ThemeOut(CamelModel):
    bubble_background: str
    wallpaper: str | None = None


class LastMessageOut(CamelModel):
    kind: MessageKind
    text: str
    sender_name: str | None
    created_at: datetime
    status: MessageStatus | None


class MemberOut(CamelModel):
    user: UserOut
    role: MemberRole


class ConversationOut(CamelModel):
    id: int
    type: ConversationType
    title: str
    avatar_url: str | None
    is_pinned: bool
    is_muted: bool
    unread_count: int
    last_message: LastMessageOut | None
    disappearing_seconds: int | None
    theme: ThemeOut | None
    members: list[MemberOut]
    my_role: MemberRole


class CreateDirectIn(CamelModel):
    user_id: int


class CreateGroupIn(CamelModel):
    title: str = Field(min_length=1, max_length=100)
    member_ids: list[int] = Field(min_length=1, max_length=255)


class UpdateConversationIn(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    # 0 turns disappearing messages off.
    disappearing_seconds: int | None = Field(default=None, ge=0, le=4 * 7 * 24 * 3600)


class MySettingsIn(CamelModel):
    is_pinned: bool | None = None
    is_muted: bool | None = None
    chat_theme: str | None = None


class AddMembersIn(CamelModel):
    user_ids: list[int] = Field(min_length=1, max_length=255)


class RoleIn(CamelModel):
    role: MemberRole
