from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_token
from app.core.security import hash_token
from app.db.session import get_db
from app.models import User
from app.schemas.security import DeviceOut
from app.services import device_service

router = APIRouter(tags=["devices"])


@router.get("/devices", response_model=list[DeviceOut])
def list_devices(
    user: User = Depends(get_current_user),
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> list[DeviceOut]:
    current = hash_token(token)
    return [
        DeviceOut(
            id=s.id,
            name=s.device_name or "Unknown device",
            created_at=s.created_at,
            last_active_at=s.last_active_at,
            is_current=s.token_hash == current,
        )
        for s in device_service.list_devices(db, user)
    ]


@router.delete("/devices/{device_id}", status_code=204)
def unlink_device(
    device_id: int,
    user: User = Depends(get_current_user),
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> Response:
    device_service.unlink(db, user, device_id, token)
    return Response(status_code=204)
