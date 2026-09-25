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


def _contact_names(account):
    return [c["displayName"] for c in account.get("/api/contacts").json()]


def test_direct_message_makes_both_people_contacts(alice, bob, dm):
    assert _contact_names(alice) == [] and _contact_names(bob) == []
    alice.send(dm, "hi")
    assert _contact_names(alice) == ["Bob"]
    assert _contact_names(bob) == ["Alice"]
    alice.send(dm, "again")  # idempotent: no duplicate rows, no error
    assert _contact_names(bob) == ["Alice"]


def test_opening_a_chat_without_messages_adds_no_contacts(alice, bob, dm):
    assert _contact_names(alice) == [] and _contact_names(bob) == []


def test_group_messages_do_not_create_contacts(alice, bob, carol, group):
    alice.send(group, "hello group")
    assert _contact_names(bob) == []


def test_messaged_person_can_be_added_to_a_group(alice, bob, carol, dm):
    bob.send(dm, "hey")  # Bob messages Alice, who never added him
    group = alice.post("/api/conversations/group", json={"title": "Us", "memberIds": [bob.id]})
    assert group.status_code == 201


def test_backfill_adds_contacts_for_existing_chats(alice, bob, dm):
    from app.db.session import session_scope
    from app.models import Contact
    from app.services import user_service

    alice.send(dm, "hi")
    with session_scope() as db:
        db.query(Contact).delete()
        db.commit()
        user_service.backfill_direct_contacts(db)
        user_service.backfill_direct_contacts(db)  # repeatable
    assert _contact_names(alice) == ["Bob"]
    assert _contact_names(bob) == ["Alice"]
