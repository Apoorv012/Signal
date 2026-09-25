"""Uploads: stored first (unattached), then linked to a message when it is sent."""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import BadRequest, NotFound
from app.models import Attachment, User
from app.services import media


def store_upload(
    db: Session,
    user: User,
    file_name: str,
    content_type: str | None,
    data: bytes,
    duration_sec: int | None = None,
) -> Attachment:
    if not data:
        raise BadRequest("Empty file")
    if len(data) > settings.max_upload_bytes:
        raise BadRequest(f"File is too large (max {settings.max_upload_bytes // (1024 * 1024)} MB)")

    mime = content_type or "application/octet-stream"
    size = media.image_size(data) if mime.startswith("image/") else None
    attachment = Attachment(
        uploader_id=user.id,
        file_name=media.safe_file_name(file_name),
        mime_type=mime,
        size_bytes=len(data),
        storage_path=media.save_bytes("attachments", file_name, data),
        width=size[0] if size else None,
        height=size[1] if size else None,
        duration_sec=duration_sec,
    )
    db.add(attachment)
    db.commit()
    return attachment


def get_unattached(db: Session, user: User, attachment_id: int) -> Attachment:
    """An attachment the user uploaded and has not used in a message yet."""
    attachment = db.get(Attachment, attachment_id)
    if attachment is None or attachment.uploader_id != user.id:
        raise NotFound("Attachment not found")
    if attachment.message_id is not None:
        raise BadRequest("Attachment was already sent")
    return attachment
