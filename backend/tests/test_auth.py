from tests.conftest import OTP


def test_wrong_otp_is_rejected(client):
    response = client.post("/api/auth/verify-otp", json={"phone": "+15550009999", "code": "000000"})
    assert response.status_code == 400


def test_invalid_phone_is_rejected(client):
    response = client.post("/api/auth/request-otp", json={"phone": "abc1234"})
    assert response.status_code == 400


def test_phone_is_normalised_so_formats_map_to_one_account(client):
    first = client.post("/api/auth/verify-otp", json={"phone": "+1 (555) 000-7777", "code": OTP})
    second = client.post("/api/auth/verify-otp", json={"phone": "15550007777", "code": OTP})
    assert first.json()["isNewUser"] is True
    assert second.json()["isNewUser"] is False
    assert first.json()["user"]["id"] == second.json()["user"]["id"]


def test_new_user_gets_note_to_self(alice):
    conversations = alice.get("/api/conversations").json()
    assert [c["type"] for c in conversations] == ["note_to_self"]
    assert conversations[0]["title"] == "Note to Self"


def test_profile_update_and_username_conflict(alice, bob):
    assert alice.patch("/api/me", json={"username": "alice_w"}).status_code == 200
    assert bob.patch("/api/me", json={"username": "alice_w"}).status_code == 409
    assert alice.get("/api/me").json()["username"] == "alice_w"


def test_requests_without_a_valid_token_are_unauthorized(client, alice):
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_logout_revokes_the_session(client, alice):
    assert alice.post("/api/auth/logout").status_code == 204
    assert client.get("/api/me", headers=alice.headers).status_code == 401
