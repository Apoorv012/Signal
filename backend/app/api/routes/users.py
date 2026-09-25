from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.user import ContactCreate, ProfileUpdate, UserOut
from app.services import presenters, user_service

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)) -> UserOut:
    return presenters.user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> UserOut:
    updated = user_service.update_profile(db, user, body.display_name, body.about, body.username)
    return presenters.user_out(updated)


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    updated = user_service.set_avatar(db, user, file.filename or "avatar", await file.read())
    return presenters.user_out(updated)


@router.get("/users/search", response_model=list[UserOut])
def search_users(
    q: str = Query(min_length=1, max_length=40),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    return [presenters.user_out(u) for u in user_service.search_users(db, user, q)]


@router.get("/contacts", response_model=list[UserOut])
def list_contacts(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[UserOut]:
    return [presenters.user_out(u) for u in user_service.list_contacts(db, user)]


@router.post("/contacts", response_model=UserOut, status_code=201)
def add_contact(
    body: ContactCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> UserOut:
    return presenters.user_out(user_service.add_contact(db, user, body.identifier))


@router.delete("/contacts/{contact_id}", status_code=204)
def remove_contact(
    contact_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    user_service.remove_contact(db, user, contact_id)
    return Response(status_code=204)
