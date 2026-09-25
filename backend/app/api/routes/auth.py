from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy.orm import Session

from app.api.deps import get_token
from app.core.config import settings
from app.db.session import get_db
from app.schemas.auth import AuthOut, OtpRequest, OtpRequestOut, OtpVerify, UsernameCredentials
from app.services import auth_service, device_service, presenters

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp", response_model=OtpRequestOut)
def request_otp(body: OtpRequest) -> OtpRequestOut:
    auth_service.normalize_phone(body.phone)  # validates the number
    return OtpRequestOut(demo_code=settings.fixed_otp)


@router.post("/verify-otp", response_model=AuthOut)
def verify_otp(
    body: OtpVerify,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AuthOut:
    device = device_service.describe_device(user_agent)
    token, user, is_new = auth_service.verify_otp(db, body.phone, body.code, device)
    return AuthOut(token=token, user=presenters.user_out(user), is_new_user=is_new)


@router.post("/register-username", response_model=AuthOut, status_code=201)
def register_username(
    body: UsernameCredentials,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AuthOut:
    device = device_service.describe_device(user_agent)
    token, user = auth_service.register_username(db, body.username, body.password, device)
    return AuthOut(token=token, user=presenters.user_out(user), is_new_user=True)


@router.post("/login-username", response_model=AuthOut)
def login_username(
    body: UsernameCredentials,
    user_agent: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AuthOut:
    device = device_service.describe_device(user_agent)
    token, user = auth_service.login_username(db, body.username, body.password, device)
    return AuthOut(token=token, user=presenters.user_out(user), is_new_user=not user.display_name)


@router.post("/logout", status_code=204)
def logout(token: str = Depends(get_token), db: Session = Depends(get_db)) -> Response:
    auth_service.logout(db, token)
    return Response(status_code=204)
