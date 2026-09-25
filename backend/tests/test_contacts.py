def test_add_contact_by_phone_and_username(alice, bob, carol):
    bob.patch("/api/me", json={"username": "bobby"})
    assert alice.post("/api/contacts", json={"identifier": "+1 555 000 1002"}).status_code == 201
    assert alice.post("/api/contacts", json={"identifier": "@bobby"}).status_code == 201  # no-op
    assert alice.post("/api/contacts", json={"identifier": "+15550001003"}).status_code == 201
    assert [c["displayName"] for c in alice.get("/api/contacts").json()] == ["Bob", "Carol"]


def test_add_unknown_contact_is_404_and_self_is_400(alice):
    assert alice.post("/api/contacts", json={"identifier": "+15559990000"}).status_code == 404
    assert alice.post("/api/contacts", json={"identifier": "+15550001001"}).status_code == 400


def test_adding_a_number_without_country_code_is_rejected(alice, bob):
    assert (
        alice.post("/api/contacts", json={"identifier": "15550001002"}).status_code == 404
    )  # a username
    assert alice.post("/api/contacts", json={"identifier": "+5550001002"}).status_code == 404


def test_remove_contact(alice, bob):
    alice.post("/api/contacts", json={"identifier": "+15550001002"})
    assert alice.delete(f"/api/contacts/{bob.id}").status_code == 204
    assert alice.get("/api/contacts").json() == []


def test_user_search_excludes_self_and_needs_two_chars(alice, bob, carol):
    assert [
        u["displayName"] for u in alice.get("/api/users/search", params={"q": "ob"}).json()
    ] == ["Bob"]
    assert alice.get("/api/users/search", params={"q": "a"}).json() == []
    assert "Alice" not in [
        u["displayName"] for u in alice.get("/api/users/search", params={"q": "Al"}).json()
    ]
