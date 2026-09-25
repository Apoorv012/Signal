"""Linked devices (= active logins) and the simulated end-to-end encryption safety numbers."""

from app.services.device_service import describe_device
from app.services.safety_service import safety_number

CHROME_WIN = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
IPHONE = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
)


def _login(client, phone, user_agent):
    response = client.post(
        "/api/auth/verify-otp",
        json={"phone": phone, "code": "123456"},
        headers={"User-Agent": user_agent},
    )
    return response.json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_user_agents_get_friendly_names():
    assert describe_device(CHROME_WIN) == "Chrome on Windows"
    assert describe_device(IPHONE) == "Safari on iPhone"  # not "macOS"
    assert (
        describe_device("Mozilla/5.0 (Windows NT 10.0) Edg/120.0 Chrome/120.0") == "Edge on Windows"
    )
    assert describe_device(None) == "Unknown device"


def test_every_login_is_a_linked_device_and_the_current_one_is_flagged(client):
    desktop = _login(client, "+15550001001", CHROME_WIN)
    phone = _login(client, "+15550001001", IPHONE)
    listed = client.get("/api/devices", headers=_auth(desktop)).json()
    assert [d["name"] for d in listed] == ["Safari on iPhone", "Chrome on Windows"]  # newest first
    assert [d["isCurrent"] for d in listed] == [False, True]
    assert listed[0]["lastActiveAt"] is not None
    from_phone = client.get("/api/devices", headers=_auth(phone)).json()
    assert [d["isCurrent"] for d in from_phone] == [True, False]


def test_unlinking_a_device_signs_it_out(client):
    desktop = _login(client, "+15550001001", CHROME_WIN)
    phone = _login(client, "+15550001001", IPHONE)
    other = client.get("/api/devices", headers=_auth(desktop)).json()[0]
    assert client.delete(f"/api/devices/{other['id']}", headers=_auth(desktop)).status_code == 204
    assert client.get("/api/me", headers=_auth(phone)).status_code == 401  # that login is revoked
    assert client.get("/api/me", headers=_auth(desktop)).status_code == 200
    assert len(client.get("/api/devices", headers=_auth(desktop)).json()) == 1


def test_you_cannot_unlink_the_device_you_are_using_or_someone_elses(client):
    mine = _login(client, "+15550001001", CHROME_WIN)
    theirs = _login(client, "+15550001002", IPHONE)
    current = client.get("/api/devices", headers=_auth(mine)).json()[0]["id"]
    foreign = client.get("/api/devices", headers=_auth(theirs)).json()[0]["id"]
    assert client.delete(f"/api/devices/{current}", headers=_auth(mine)).status_code == 400
    assert client.delete(f"/api/devices/{foreign}", headers=_auth(mine)).status_code == 404


def test_safety_number_is_symmetric_and_looks_like_signals(alice, bob, dm):
    a = alice.get(f"/api/conversations/{dm}/safety-number").json()
    b = bob.get(f"/api/conversations/{dm}/safety-number").json()
    assert a["number"] == b["number"]
    groups = a["number"].split(" ")
    assert len(groups) == 12 and all(len(g) == 5 and g.isdigit() for g in groups)
    assert a["peerName"] == "Bob" and b["peerName"] == "Alice"
    assert a["simulated"] is True
    assert safety_number("a", "b") == safety_number("b", "a")


def test_verification_is_personal_and_reversible(alice, bob, dm):
    assert alice.post(
        f"/api/conversations/{dm}/safety-number/verify", json={"verified": True}
    ).json()["verified"]
    assert alice.get(f"/api/conversations/{dm}/safety-number").json()["verified"] is True
    assert bob.get(f"/api/conversations/{dm}/safety-number").json()["verified"] is False
    alice.post(f"/api/conversations/{dm}/safety-number/verify", json={"verified": False})
    assert alice.get(f"/api/conversations/{dm}/safety-number").json()["verified"] is False


def test_safety_numbers_only_exist_for_direct_chats_you_are_in(alice, bob, carol, dm, group):
    assert alice.get(f"/api/conversations/{group}/safety-number").status_code == 400
    assert carol.get(f"/api/conversations/{dm}/safety-number").status_code == 403


def test_each_pair_of_people_has_a_different_number(alice, bob, carol, dm):
    other = alice.post("/api/conversations/direct", json={"userId": carol.id}).json()["id"]
    first = alice.get(f"/api/conversations/{dm}/safety-number").json()["number"]
    second = alice.get(f"/api/conversations/{other}/safety-number").json()["number"]
    assert first != second
