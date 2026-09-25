"""Test setup: an isolated SQLite file and media folder per test session, tables reset per test."""

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="signal-tests-"))
# Must be set before `app` is imported: settings are read once at import time.
os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["MEDIA_DIR"] = str(_TMP / "media")
os.environ["SEED_ON_STARTUP"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402

OTP = "123456"


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as test_client:  # `with` runs the lifespan (binds the WebSocket loop)
        yield test_client


class Account:
    """A logged-in test user with a ready-to-use auth header."""

    def __init__(self, client: TestClient, phone: str, name: str) -> None:
        self.client = client
        response = client.post("/api/auth/verify-otp", json={"phone": phone, "code": OTP})
        assert response.status_code == 200, response.text
        data = response.json()
        self.id: int = data["user"]["id"]
        self.token: str = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        client.patch("/api/me", json={"displayName": name}, headers=self.headers)

    def get(self, url: str, **kwargs):
        return self.client.get(url, headers=self.headers, **kwargs)

    def post(self, url: str, **kwargs):
        return self.client.post(url, headers=self.headers, **kwargs)

    def patch(self, url: str, **kwargs):
        return self.client.patch(url, headers=self.headers, **kwargs)

    def put(self, url: str, **kwargs):
        return self.client.put(url, headers=self.headers, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.client.delete(url, headers=self.headers, **kwargs)

    def send(self, conversation_id: int, body: str, client_id: str | None = None, **extra):
        payload = {"clientId": client_id or f"c-{body}", "body": body, **extra}
        return self.post(f"/api/conversations/{conversation_id}/messages", json=payload)

    def ws(self):
        return self.client.websocket_connect(f"/ws?token={self.token}")


@pytest.fixture()
def alice(client) -> Account:
    return Account(client, "+15550001001", "Alice")


@pytest.fixture()
def bob(client) -> Account:
    return Account(client, "+15550001002", "Bob")


@pytest.fixture()
def carol(client) -> Account:
    return Account(client, "+15550001003", "Carol")


@pytest.fixture()
def dm(alice, bob) -> int:
    """Conversation id of the Alice <-> Bob direct chat."""
    return alice.post("/api/conversations/direct", json={"userId": bob.id}).json()["id"]


@pytest.fixture()
def group(alice, bob, carol) -> int:
    """Group "Trip" created by Alice (admin) with Bob and Carol."""
    body = {"title": "Trip", "memberIds": [bob.id, carol.id]}
    return alice.post("/api/conversations/group", json=body).json()["id"]
