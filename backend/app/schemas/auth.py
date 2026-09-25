from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.user import UserOut


class OtpRequest(CamelModel):
    phone: str = Field(min_length=7, max_length=24)


class OtpRequestOut(CamelModel):
    sent: bool = True
    # Verification is mocked: the client is told the fixed code so the demo is usable.
    demo_code: str


class OtpVerify(CamelModel):
    phone: str = Field(min_length=7, max_length=24)
    code: str = Field(min_length=4, max_length=8)


class UsernameCredentials(CamelModel):
    username: str = Field(min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_.]+$")
    password: str = Field(min_length=8, max_length=128)


class AuthOut(CamelModel):
    token: str
    user: UserOut
    is_new_user: bool
