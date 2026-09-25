from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_token
from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import AuthOut, OtpRequest, OtpRequestOut, OtpVerify
from app.services import auth_service, presenters

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp", response_model=OtpRequestOut)
def request_otp(body: OtpRequest) -> OtpRequestOut:
    auth_service.normalize_phone(body.phone)  # validates the number
    return OtpRequestOut(demo_code=settings.fixed_otp)


@router.post("/verify-otp", response_model=AuthOut)
def verify_otp(body: OtpVerify, db: Session = Depends(get_db)) -> AuthOut:
    token, user, is_new = auth_service.verify_otp(db, body.phone, body.code)
    return AuthOut(token=token, user=presenters.user_out(user), is_new_user=is_new)


@router.post("/logout", status_code=204)
def logout(token: str = Depends(get_token), db: Session = Depends(get_db)) -> Response:
    auth_service.logout(db, token)
    return Response(status_code=204)
