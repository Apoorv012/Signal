"""Importing this package registers every model on Base.metadata."""

from app.models.conversation import Conversation, ConversationMember
from app.models.enums import ConversationType, MemberRole, MessageKind, MessageStatus
from app.models.message import Attachment, Message, MessageHidden, MessageReceipt, Reaction
from app.models.user import AuthSession, Contact, User

__all__ = [
    "Attachment",
    "AuthSession",
    "Contact",
    "Conversation",
    "ConversationMember",
    "ConversationType",
    "MemberRole",
    "Message",
    "MessageHidden",
    "MessageKind",
    "MessageReceipt",
    "MessageStatus",
    "Reaction",
    "User",
]
