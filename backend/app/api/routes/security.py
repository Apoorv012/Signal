from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.security import SafetyNumberOut, VerifyIn
from app.services import safety_service

router = APIRouter(prefix="/conversations", tags=["security"])


@router.get("/{conversation_id}/safety-number", response_model=SafetyNumberOut)
def get_safety_number(
    conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SafetyNumberOut:
    peer, number, verified = safety_service.get_safety_number(db, user, conversation_id)
    return SafetyNumberOut(number=number, verified=verified, peer_name=peer.fallback_name)


@router.post("/{conversation_id}/safety-number/verify", response_model=SafetyNumberOut)
def verify_safety_number(
    conversation_id: int,
    body: VerifyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SafetyNumberOut:
    peer, number, verified = safety_service.set_verified(db, user, conversation_id, body.verified)
    return SafetyNumberOut(number=number, verified=verified, peer_name=peer.fallback_name)
