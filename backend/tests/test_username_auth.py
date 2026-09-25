"""Registering and logging in with a username + password instead of a phone number."""

import sqlite3

from sqlalchemy import create_engine, inspect

from app.core.security import hash_password, verify_password
from app.db.columns import add_missing_columns


def _register(client, username="sam_k", password="correct horse"):
    return client.post(
        "/api/auth/register-username", json={"username": username, "password": password}
    )


def test_register_then_login_with_username(client):
    created = _register(client)
    assert created.status_code == 201
    body = created.json()
    assert body["isNewUser"] is True
    assert body["user"]["username"] == "sam_k" and body["user"]["phone"] is None
    assert body["user"]["displayName"] == "@sam_k"  # until they pick a name

    login = client.post(
        "/api/auth/login-username", json={"username": "SAM_K", "password": "correct horse"}
    )
    assert login.status_code == 200  # usernames are case-insensitive
    assert login.json()["user"]["id"] == body["user"]["id"]
    me = client.get("/api/me", headers={"Authorization": f"Bearer {login.json()['token']}"})
    assert me.status_code == 200


def test_username_is_unique_ignoring_case(client):
    assert _register(client, "Maya_J").status_code == 201
    taken = _register(client, "maya_j")
    assert taken.status_code == 409


def test_wrong_password_and_unknown_user_look_the_same(client):
    _register(client)
    wrong = client.post(
        "/api/auth/login-username", json={"username": "sam_k", "password": "nope nope nope"}
    )
    unknown = client.post(
        "/api/auth/login-username", json={"username": "ghost", "password": "correct horse"}
    )
    assert wrong.status_code == unknown.status_code == 400
    assert wrong.json() == unknown.json()


def test_phone_accounts_cannot_log_in_with_a_password(client, alice):
    client.patch("/api/me", json={"username": "alice_a"}, headers=alice.headers)
    tried = client.post(
        "/api/auth/login-username", json={"username": "alice_a", "password": "anything goes"}
    )
    assert tried.status_code == 400


def test_credentials_are_validated(client):
    assert _register(client, "ab").status_code == 422  # too short
    assert _register(client, "bad name!").status_code == 422
    assert _register(client, "valid_name", "short").status_code == 422


def test_username_accounts_add_each_other_by_username_and_chat(client, alice):
    sam = _register(client, "sam_k").json()
    sam_headers = {"Authorization": f"Bearer {sam['token']}"}
    client.post(
        "/api/auth/register-username", json={"username": "pat_r", "password": "another pass"}
    )
    added = client.post("/api/contacts", json={"identifier": "@PAT_R"}, headers=sam_headers)
    assert added.status_code == 201 and added.json()["username"] == "pat_r"

    # A username account and a phone account can also add each other and talk.
    client.patch("/api/me", json={"username": "alice_a"}, headers=alice.headers)
    assert (
        client.post(
            "/api/contacts", json={"identifier": "@alice_a"}, headers=sam_headers
        ).status_code
        == 201
    )
    chat = client.post(
        "/api/conversations/direct", json={"userId": alice.id}, headers=sam_headers
    ).json()
    sent = client.post(
        f"/api/conversations/{chat['id']}/messages",
        json={"clientId": "c1", "body": "hi from a username account"},
        headers=sam_headers,
    )
    assert sent.status_code == 201
    titles = [c["title"] for c in alice.get("/api/conversations").json()]
    assert "@sam_k" in titles


def test_only_unique_usernames_can_be_claimed_in_the_profile(client, alice, bob):
    client.patch("/api/me", json={"username": "shared_name"}, headers=alice.headers)
    clash = client.patch("/api/me", json={"username": "SHARED_NAME"}, headers=bob.headers)
    assert clash.status_code == 409


def test_password_hashing_round_trip():
    stored = hash_password("s3cret pass")
    assert stored != "s3cret pass" and verify_password("s3cret pass", stored)
    assert not verify_password("S3cret pass", stored) and not verify_password("x", "garbage")
    assert hash_password("s3cret pass") != stored  # random salt


def test_old_database_gets_a_nullable_phone_and_keeps_its_rows(tmp_path):
    """An existing database declared users.phone NOT NULL: the rebuild must relax it, keep data."""
    path = tmp_path / "old.db"
    db = sqlite3.connect(path)
    db.executescript(
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY, phone VARCHAR(20) NOT NULL, username VARCHAR(32),
            display_name VARCHAR(64) NOT NULL DEFAULT '', about VARCHAR(140) NOT NULL DEFAULT '',
            avatar_path VARCHAR(255), last_seen_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX ix_users_phone ON users (phone);
        CREATE TABLE contacts (
            owner_id INTEGER REFERENCES users(id), contact_id INTEGER REFERENCES users(id)
        );
        INSERT INTO users (id, phone, display_name)
            VALUES (1, '+15550000001', 'Riley'), (2, '+15550000002', 'Maya');
        INSERT INTO contacts VALUES (1, 2);
        """
    )
    db.commit()
    db.close()

    engine = create_engine(f"sqlite:///{path}")
    add_missing_columns(engine)
    add_missing_columns(engine)  # repeatable
    columns = {c["name"]: c for c in inspect(engine).get_columns("users")}
    assert columns["phone"]["nullable"] is True and "password_hash" in columns

    check = sqlite3.connect(path)
    assert check.execute("SELECT id, phone, display_name FROM users ORDER BY id").fetchall() == [
        (1, "+15550000001", "Riley"),
        (2, "+15550000002", "Maya"),
    ]
    assert check.execute("SELECT * FROM contacts").fetchall() == [(1, 2)]
    # Two accounts without a phone number can now coexist (NULLs do not collide in a UNIQUE index).
    check.execute(
        "INSERT INTO users (id, username, display_name, about, created_at) "
        "VALUES (3, 'sam', '', '', '2026-01-01'), (4, 'pat', '', '', '2026-01-01')"
    )
    check.close()


def test_phone_account_can_add_a_username_and_password_and_log_in_both_ways(client, alice):
    client.patch("/api/me", json={"username": "alice_a"}, headers=alice.headers)
    no_current = client.post(
        "/api/me/password", json={"password": "long enough pw"}, headers=alice.headers
    )
    assert no_current.status_code == 200 and no_current.json()["hasPassword"] is True
    login = client.post(
        "/api/auth/login-username", json={"username": "alice_a", "password": "long enough pw"}
    )
    assert login.status_code == 200 and login.json()["user"]["id"] == alice.id  # same account
    phone_login = client.post(
        "/api/auth/verify-otp", json={"phone": "+15550001001", "code": "123456"}
    )
    assert phone_login.json()["user"]["id"] == alice.id


def test_password_needs_a_username_and_the_current_password_to_change(client, alice):
    assert (
        client.post(
            "/api/me/password", json={"password": "long enough pw"}, headers=alice.headers
        ).status_code
        == 400
    )
    client.patch("/api/me", json={"username": "alice_a"}, headers=alice.headers)
    client.post("/api/me/password", json={"password": "long enough pw"}, headers=alice.headers)
    wrong = client.post(
        "/api/me/password",
        json={"password": "another long pw", "currentPassword": "nope nope"},
        headers=alice.headers,
    )
    assert wrong.status_code == 400
    ok = client.post(
        "/api/me/password",
        json={"password": "another long pw", "currentPassword": "long enough pw"},
        headers=alice.headers,
    )
    assert ok.status_code == 200


def test_username_account_can_attach_a_free_phone_number(client):
    sam = _register(client, "sam_k").json()
    headers = {"Authorization": f"Bearer {sam['token']}"}
    bad = client.post(
        "/api/me/phone", json={"phone": "+15557770000", "code": "000000"}, headers=headers
    )
    assert bad.status_code == 400
    attached = client.post(
        "/api/me/phone", json={"phone": "+1 555 777 0000", "code": "123456"}, headers=headers
    )
    assert attached.status_code == 200 and attached.json()["phone"] == "+15557770000"
    by_phone = client.post("/api/auth/verify-otp", json={"phone": "+15557770000", "code": "123456"})
    assert (
        by_phone.json()["user"]["id"] == sam["user"]["id"]
    )  # the phone now logs into the same account


def test_a_number_owned_by_another_account_is_refused_not_merged(client, alice):
    sam = _register(client, "sam_k").json()
    headers = {"Authorization": f"Bearer {sam['token']}"}
    clash = client.post(
        "/api/me/phone", json={"phone": "+15550001001", "code": "123456"}, headers=headers
    )
    assert clash.status_code == 409
