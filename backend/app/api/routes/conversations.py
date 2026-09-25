from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Conversation, User
from app.schemas.conversation import (
    AddMembersIn,
    ConversationOut,
    CreateDirectIn,
    CreateGroupIn,
    MySettingsIn,
    RoleIn,
    UpdateConversationIn,
)
from app.services import conversation_service, presenters, queries

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _out(db: Session, conversation: Conversation, user: User) -> ConversationOut:
    return presenters.conversation_out(db, conversation, user.id)


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ConversationOut]:
    return [_out(db, c, user) for c in conversation_service.list_conversations(db, user.id)]


@router.post("/direct", response_model=ConversationOut)
def create_direct(
    body: CreateDirectIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ConversationOut:
    return _out(db, conversation_service.create_direct(db, user, body.user_id), user)


@router.post("/group", response_model=ConversationOut, status_code=201)
def create_group(
    body: CreateGroupIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ConversationOut:
    return _out(db, conversation_service.create_group(db, user, body.title, body.member_ids), user)


@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ConversationOut:
    queries.require_member(db, conversation_id, user.id)
    return _out(db, queries.get_conversation(db, conversation_id), user)


@router.patch("/{conversation_id}", response_model=ConversationOut)
def update_conversation(
    conversation_id: int,
    body: UpdateConversationIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    conversation = conversation_service.update_conversation(
        db, user, conversation_id, body.title, body.disappearing_seconds
    )
    return _out(db, conversation, user)


@router.patch("/{conversation_id}/me", response_model=ConversationOut)
def update_my_settings(
    conversation_id: int,
    body: MySettingsIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    conversation = conversation_service.update_my_settings(
        db,
        user,
        conversation_id,
        body.is_pinned,
        body.is_muted,
        body.marked_unread,
        body.chat_theme,
    )
    return _out(db, conversation, user)


@router.post("/{conversation_id}/clear", response_model=ConversationOut)
def clear_history(
    conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ConversationOut:
    return _out(db, conversation_service.clear_history(db, user, conversation_id), user)


@router.post("/{conversation_id}/members", response_model=ConversationOut)
def add_members(
    conversation_id: int,
    body: AddMembersIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    return _out(
        db, conversation_service.add_members(db, user, conversation_id, body.user_ids), user
    )


@router.delete("/{conversation_id}/members/{member_id}", response_model=ConversationOut | None)
def remove_member(
    conversation_id: int,
    member_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut | None:
    conversation = conversation_service.remove_member(db, user, conversation_id, member_id)
    # A user who just left can no longer view the conversation: return the caller's view or nothing.
    if queries.get_active_member(db, conversation_id, user.id) is None:
        return None
    return _out(db, conversation, user)


@router.patch("/{conversation_id}/members/{member_id}", response_model=ConversationOut)
def set_member_role(
    conversation_id: int,
    member_id: int,
    body: RoleIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    conversation = conversation_service.set_role(db, user, conversation_id, member_id, body.role)
    return _out(db, conversation, user)
