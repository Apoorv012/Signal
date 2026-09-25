from enum import StrEnum


class ConversationType(StrEnum):
    DIRECT = "direct"
    GROUP = "group"
    NOTE_TO_SELF = "note_to_self"


class MemberRole(StrEnum):
    ADMIN = "admin"
    MEMBER = "member"


class MessageKind(StrEnum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    VOICE = "voice"
    SYSTEM = "system"


class MessageStatus(StrEnum):
    """Client-visible delivery state of a message I sent ("sending" only exists on the client)."""

    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
