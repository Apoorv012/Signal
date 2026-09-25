"""Disk storage for uploaded files (avatars, attachments). Paths are relative to MEDIA_DIR."""

import re
import uuid
from io import BytesIO
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from app.core.config import settings


def safe_file_name(name: str) -> str:
    """Strips any directory part and unusual characters from a client-supplied name."""
    base = Path(name.replace("\\", "/")).name or "file"
    return re.sub(r"[^\w.\- ()&]", "_", base)[:120]


def save_bytes(subdir: str, original_name: str, data: bytes) -> str:
    """Stores `data` under a random name (keeps the extension). Returns the relative path."""
    extension = Path(safe_file_name(original_name)).suffix.lower()[:10]
    relative = f"{subdir}/{uuid.uuid4().hex}{extension}"
    target = settings.media_dir / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return relative


def image_size(data: bytes) -> tuple[int, int] | None:
    try:
        with Image.open(BytesIO(data)) as image:
            return image.size
    except (UnidentifiedImageError, OSError):
        return None
