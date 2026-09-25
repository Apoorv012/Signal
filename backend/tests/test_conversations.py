def test_direct_chat_is_deduplicated_from_both_sides(alice, bob):
    first = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()
    again = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()
    from_bob = bob.post("/api/conversations/direct", json={"userId": alice.id}).json()
    assert first["id"] == again["id"] == from_bob["id"]
    # Each side sees the other person as the title.
    assert first["title"] == "Bob"
    assert from_bob["title"] == "Alice"


def test_conversation_list_is_sorted_by_recent_activity(alice, bob, carol):
    with_bob = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()["id"]
    with_carol = alice.post("/api/conversations/direct", json={"userId": carol.id}).json()["id"]
    alice.send(with_bob, "older")
    alice.send(with_carol, "newer")
    order = [c["id"] for c in alice.get("/api/conversations").json()]
    assert order.index(with_carol) < order.index(with_bob)


def test_group_creation_and_membership(alice, bob, carol, group):
    conversation = alice.get(f"/api/conversations/{group}").json()
    roles = {m["user"]["displayName"]: m["role"] for m in conversation["members"]}
    assert roles == {"Alice": "admin", "Bob": "member", "Carol": "member"}
    assert conversation["title"] == "Trip"
    assert bob.get(f"/api/conversations/{group}").status_code == 200


def test_non_members_cannot_see_a_conversation(client, alice, bob, carol, dm):
    assert carol.get(f"/api/conversations/{dm}").status_code == 403
    assert carol.get(f"/api/conversations/{dm}/messages").status_code == 403
    assert carol.send(dm, "hi").status_code == 403
    assert carol.get("/api/conversations/9999").status_code == 404


def test_only_admins_can_add_or_remove_members(alice, bob, carol, group, client):
    dave_phone = "+15550001004"
    dave = client.post("/api/auth/verify-otp", json={"phone": dave_phone, "code": "123456"}).json()
    dave_id = dave["user"]["id"]

    assert (
        bob.post(f"/api/conversations/{group}/members", json={"userIds": [dave_id]}).status_code
        == 403
    )
    assert bob.delete(f"/api/conversations/{group}/members/{carol.id}").status_code == 403

    added = alice.post(f"/api/conversations/{group}/members", json={"userIds": [dave_id]})
    assert added.status_code == 200
    assert len(added.json()["members"]) == 4

    removed = alice.delete(f"/api/conversations/{group}/members/{carol.id}")
    assert removed.status_code == 200
    assert carol.get(f"/api/conversations/{group}").status_code == 403


def test_membership_changes_post_system_messages(alice, bob, carol, group):
    alice.delete(f"/api/conversations/{group}/members/{carol.id}")
    texts = [m["body"] for m in alice.get(f"/api/conversations/{group}/messages").json()]
    assert "Alice removed Carol." in texts


def test_leaving_promotes_a_new_admin_when_the_last_admin_leaves(alice, bob, group):
    assert alice.delete(f"/api/conversations/{group}/members/{alice.id}").status_code == 200
    members = bob.get(f"/api/conversations/{group}").json()["members"]
    assert {m["user"]["displayName"]: m["role"] for m in members}["Bob"] == "admin"


def test_cannot_demote_the_only_admin(alice, group):
    response = alice.patch(
        f"/api/conversations/{group}/members/{alice.id}", json={"role": "member"}
    )
    assert response.status_code == 400


def test_promote_member_to_admin(alice, bob, group):
    response = alice.patch(f"/api/conversations/{group}/members/{bob.id}", json={"role": "admin"})
    assert response.status_code == 200
    assert bob.patch(f"/api/conversations/{group}", json={"title": "Renamed"}).status_code == 200


def test_group_needs_other_members(alice):
    response = alice.post(
        "/api/conversations/group", json={"title": "Solo", "memberIds": [alice.id]}
    )
    assert response.status_code == 400


def test_personal_settings_are_private(alice, bob, dm):
    alice.patch(f"/api/conversations/{dm}/me", json={"isPinned": True, "chatTheme": "crimson"})
    assert alice.get(f"/api/conversations/{dm}").json()["isPinned"] is True
    assert alice.get(f"/api/conversations/{dm}").json()["theme"]["bubbleBackground"] == "#cf163f"
    assert bob.get(f"/api/conversations/{dm}").json()["isPinned"] is False


def test_disappearing_timer_posts_a_system_message(alice, dm):
    response = alice.patch(f"/api/conversations/{dm}", json={"disappearingSeconds": 86400})
    assert response.json()["disappearingSeconds"] == 86400
    messages = alice.get(f"/api/conversations/{dm}/messages").json()
    assert messages[-1]["kind"] == "system"
    assert "1 day" in messages[-1]["body"]


def test_direct_chat_stays_hidden_until_the_first_message(alice, bob):
    conversation_id = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()["id"]
    # Opened but nothing sent: invisible to both people, though still reachable by id.
    assert conversation_id not in [c["id"] for c in alice.get("/api/conversations").json()]
    assert conversation_id not in [c["id"] for c in bob.get("/api/conversations").json()]
    assert alice.get(f"/api/conversations/{conversation_id}").status_code == 200

    alice.send(conversation_id, "hello")
    assert conversation_id in [c["id"] for c in alice.get("/api/conversations").json()]
    assert conversation_id in [c["id"] for c in bob.get("/api/conversations").json()]


def test_empty_groups_and_note_to_self_are_listed(alice, bob):
    group = alice.post(
        "/api/conversations/group", json={"title": "New", "memberIds": [bob.id]}
    ).json()
    listed = {c["id"]: c["type"] for c in bob.get("/api/conversations").json()}
    assert listed[group["id"]] == "group"
    assert "note_to_self" in [c["type"] for c in alice.get("/api/conversations").json()]


def test_list_is_ordered_by_last_activity_and_exposes_it(alice, bob, carol):
    with_bob = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()["id"]
    with_carol = alice.post("/api/conversations/direct", json={"userId": carol.id}).json()["id"]
    alice.send(with_bob, "one")
    alice.send(with_carol, "two")
    listing = alice.get("/api/conversations").json()
    stamps = [c["lastActivityAt"] for c in listing]
    assert stamps == sorted(stamps, reverse=True)
    assert [c["id"] for c in listing][:2] == [with_carol, with_bob]
    # An untouched Note to Self sorts by when it was created, i.e. below active chats.
    assert listing[-1]["type"] == "note_to_self"
