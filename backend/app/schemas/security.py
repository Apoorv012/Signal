from datetime import datetime

from app.schemas.common import CamelModel


class DeviceOut(CamelModel):
    id: int
    name: str
    created_at: datetime
    last_active_at: datetime | None
    is_current: bool


class SafetyNumberOut(CamelModel):
    number: str
    verified: bool
    peer_name: str
    # Always true here: says out loud that the encryption is a demo, not the real thing.
    simulated: bool = True


class VerifyIn(CamelModel):
    verified: bool
