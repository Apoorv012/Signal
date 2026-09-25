"""Right-click actions: mark unread, clear chat, delete messages (for me / for everyone)."""

from datetime import timedelta

from sqlalchemy import create_engine, inspect, text

from app.core.clock import utcnow
from app.db.columns import add_missing_columns
from tests.test_realtime import receive_until


def _list(account, conversation_id):
    return [m["body"] for m in account.get(f"/api/conversations/{conversation_id}/messages").json()]


def _chat_ids(account):
    return [c["id"] for c in account.get("/api/conversations").json()]


def test_mark_unread_flag_is_cleared_when_the_chat_is_read(alice, bob, dm):
    sent = alice.send(dm, "hi").json()
    flagged = bob.patch(f"/api/conversations/{dm}/me", json={"markedUnread": True}).json()
    assert flagged["markedUnread"] is True
    bob.post(f"/api/conversations/{dm}/read", json={"upToMessageId": sent["id"]})
    assert bob.get(f"/api/conversations/{dm}").json()["markedUnread"] is False


def test_clear_hides_history_only_for_me_and_removes_an_empty_direct_chat(alice, bob, dm):
    alice.send(dm, "one")
    bob.send(dm, "two")
    cleared = alice.post(f"/api/conversations/{dm}/clear")
    assert cleared.status_code == 200
    assert _list(alice, dm) == []
    assert dm not in _chat_ids(alice)  # empty direct chats are not listed
    assert _list(bob, dm) == ["one", "two"]  # the other person keeps everything

    bob.send(dm, "three")  # a new message brings the chat back, without the old history
    assert _list(alice, dm) == ["three"]
    assert dm in _chat_ids(alice)


def test_clear_keeps_a_group_listed_but_empty(alice, bob, carol, group):
    alice.send(group, "hello")
    alice.post(f"/api/conversations/{group}/clear")
    listed = {c["id"]: c for c in alice.get("/api/conversations").json()}
    assert group in listed and listed[group]["lastMessage"] is None
    assert listed[group]["unreadCount"] == 0


def test_delete_for_me_hides_the_message_only_for_me(alice, bob, dm):
    mine = alice.send(dm, "keep for bob").json()["id"]
    theirs = bob.send(dm, "from bob").json()["id"]
    response = alice.post("/api/messages/delete", json={"messageIds": [mine, theirs]})
    assert response.status_code == 204
    assert _list(alice, dm) == []
    assert _list(bob, dm) == ["keep for bob", "from bob"]


def test_delete_for_everyone_removes_it_for_all_and_notifies_live(alice, bob, dm):
    message = alice.send(dm, "oops").json()["id"]
    with bob.ws() as bob_ws:
        response = alice.post(
            "/api/messages/delete", json={"messageIds": [message], "forEveryone": True}
        )
        assert response.status_code == 204
        event = receive_until(bob_ws, "message.deleted")
        assert event == {"conversationId": dm, "messageIds": [message]}
    assert _list(alice, dm) == [] and _list(bob, dm) == []


def test_delete_for_everyone_is_limited_to_your_own_recent_messages(alice, bob, dm):
    theirs = bob.send(dm, "not yours").json()["id"]
    denied = alice.post("/api/messages/delete", json={"messageIds": [theirs], "forEveryone": True})
    assert denied.status_code == 403

    old = alice.send(dm, "old").json()["id"]
    from app.db.session import session_scope
    from app.models import Message

    with session_scope() as db:
        db.get(Message, old).created_at = utcnow() - timedelta(hours=25)
        db.commit()
    too_old = alice.post("/api/messages/delete", json={"messageIds": [old], "forEveryone": True})
    assert too_old.status_code == 400


def test_you_cannot_delete_messages_of_chats_you_are_not_in(alice, bob, carol, dm):
    message = alice.send(dm, "private").json()["id"]
    assert carol.post("/api/messages/delete", json={"messageIds": [message]}).status_code == 403


def test_preview_and_search_respect_deleted_messages(alice, bob, dm):
    alice.send(dm, "first")
    second = alice.send(dm, "second secret").json()["id"]
    alice.post("/api/messages/delete", json={"messageIds": [second]})
    chat = alice.get(f"/api/conversations/{dm}").json()
    assert chat["lastMessage"]["text"] == "first"
    assert alice.get("/api/messages/search", params={"q": "secret"}).json() == []
    assert len(bob.get("/api/messages/search", params={"q": "secret"}).json()) == 1


def test_missing_columns_are_added_to_an_old_database():
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE conversation_members (conversation_id INTEGER)"))
    add_missing_columns(engine)
    add_missing_columns(engine)  # idempotent
    columns = {c["name"] for c in inspect(engine).get_columns("conversation_members")}
    assert {"cleared_at", "marked_unread"} <= columns
