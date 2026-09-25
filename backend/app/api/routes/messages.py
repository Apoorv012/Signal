from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.message import (
    AttachmentOut,
    DeleteMessagesIn,
    MessageOut,
    ReactionIn,
    ReadIn,
    SendMessageIn,
)
from app.services import attachment_service, message_service, presenters

router = APIRouter(tags=["messages"])


@router.get("/messages/search", response_model=list[MessageOut])
def search_messages(
    q: str = Query(min_length=1, max_length=100),
    conversation_id: int | None = Query(default=None, alias="conversationId"),
    limit: int = Query(default=50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    """Search my messages, optionally within one conversation (used by both search UIs)."""
    messages = message_service.search_messages(db, user, q, conversation_id, limit)
    return [presenters.message_out(db, m, user.id) for m in messages]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(
    conversation_id: int,
    before: int | None = Query(default=None, description="Return messages older than this id"),
    limit: int = Query(default=50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    messages = message_service.list_messages(db, user, conversation_id, before, limit)
    return [presenters.message_out(db, m, user.id) for m in messages]


@router.post(
    "/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201
)
def send_message(
    conversation_id: int,
    body: SendMessageIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    message = message_service.send_message(
        db, user, conversation_id, body.client_id, body.body, body.reply_to_id, body.attachment_id
    )
    return presenters.message_out(db, message, user.id)


@router.post("/conversations/{conversation_id}/read", status_code=204)
def mark_read(
    conversation_id: int,
    body: ReadIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    message_service.mark_conversation_read(db, user, conversation_id, body.up_to_message_id)
    return Response(status_code=204)


@router.post("/messages/delete", status_code=204)
def delete_messages(
    body: DeleteMessagesIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    message_service.delete_messages(db, user, body.message_ids, body.for_everyone)
    return Response(status_code=204)


@router.put("/messages/{message_id}/reaction", response_model=MessageOut)
def set_reaction(
    message_id: int,
    body: ReactionIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    return presenters.message_out(
        db, message_service.set_reaction(db, user, message_id, body.emoji), user.id
    )


@router.delete("/messages/{message_id}/reaction", response_model=MessageOut)
def remove_reaction(
    message_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> MessageOut:
    return presenters.message_out(
        db, message_service.remove_reaction(db, user, message_id), user.id
    )


@router.post("/attachments", response_model=AttachmentOut, status_code=201)
async def upload_attachment(
    file: UploadFile = File(...),
    duration_sec: int | None = Form(default=None, alias="durationSec"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttachmentOut:
    attachment = attachment_service.store_upload(
        db, user, file.filename or "file", file.content_type, await file.read(), duration_sec
    )
    return presenters.attachment_out(attachment)
