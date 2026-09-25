from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.errors import Unauthorized
from app.db.session import get_db
from app.models import User
from app.services import auth_service


def get_token(authorization: str | None = Header(default=None)) -> str:
    """Extracts the bearer token from `Authorization: Bearer <token>`."""
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise Unauthorized("Missing bearer token")
    return token


def get_current_user(token: str = Depends(get_token), db: Session = Depends(get_db)) -> User:
    return auth_service.user_from_token(db, token)
