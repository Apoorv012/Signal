"""WebSocket behaviour: pushes, typing, presence and auth."""

import pytest
from starlette.websockets import WebSocketDisconnect


def receive_until(ws, event_type: str, limit: int = 10) -> dict:
    """Reads events until one of the wanted type arrives (presence events may interleave)."""
    for _ in range(limit):
        event = ws.receive_json()
        if event["type"] == event_type:
            return event["data"]
    raise AssertionError(f"no {event_type!r} event received")


def test_socket_requires_a_valid_token(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws?token=bogus") as ws:
            ws.receive_json()


def test_message_is_pushed_to_the_recipient_in_real_time(alice, bob, dm):
    with bob.ws() as bob_ws:
        alice.send(dm, "live!")
        data = receive_until(bob_ws, "message.created")
        assert data["body"] == "live!"
        assert data["conversationId"] == dm
        assert data["senderId"] == alice.id


def test_sender_sees_delivered_then_read_ticks_live(alice, bob, dm):
    with alice.ws() as alice_ws, bob.ws():
        sent = alice.send(dm, "ticks").json()
        assert sent["status"] == "delivered"  # Bob is online, so it is delivered immediately
        assert receive_until(alice_ws, "message.status")["status"] == "delivered"

        bob.post(f"/api/conversations/{dm}/read", json={"upToMessageId": sent["id"]})
        update = receive_until(alice_ws, "message.status")
        assert (update["messageId"], update["status"]) == (sent["id"], "read")


def test_typing_indicator_reaches_the_other_members_only(alice, bob, carol, group, dm):
    with alice.ws() as alice_ws, bob.ws() as bob_ws:
        alice_ws.send_json({"type": "typing", "conversationId": group, "isTyping": True})
        data = receive_until(bob_ws, "typing")
        assert data == {"conversationId": group, "userId": alice.id, "isTyping": True}


def test_typing_in_a_conversation_you_are_not_in_is_ignored(alice, bob, carol, dm):
    with carol.ws() as carol_ws, bob.ws() as bob_ws:
        carol_ws.send_json({"type": "typing", "conversationId": dm, "isTyping": True})
        alice.send(dm, "marker")  # if the typing event leaked it would arrive before this
        assert receive_until(bob_ws, "message.created")["body"] == "marker"


def test_presence_is_broadcast_to_people_sharing_a_conversation(alice, bob, dm):
    with alice.ws() as alice_ws:
        with bob.ws():
            online = receive_until(alice_ws, "presence")
            assert online["userId"] == bob.id and online["isOnline"] is True
        offline = receive_until(alice_ws, "presence")
        assert offline["userId"] == bob.id and offline["isOnline"] is False


def test_reaction_update_is_pushed_with_viewer_specific_flags(alice, bob, dm):
    message = alice.send(dm, "react to me").json()
    with alice.ws() as alice_ws, bob.ws() as bob_ws:
        bob.put(f"/api/messages/{message['id']}/reaction", json={"emoji": "👍"})
        for ws, expect_mine in ((alice_ws, False), (bob_ws, True)):
            reactions = receive_until(ws, "reaction.updated")["reactions"]
            assert reactions == [{"emoji": "👍", "count": 1, "reactedByMe": expect_mine}]


def test_new_group_is_pushed_to_members(alice, bob, carol):
    with bob.ws() as bob_ws:
        alice.post("/api/conversations/group", json={"title": "Fresh", "memberIds": [bob.id]})
        data = receive_until(bob_ws, "conversation.updated")
        assert data["title"] == "Fresh" and data["type"] == "group"


def test_removed_member_is_told_the_conversation_is_gone(alice, bob, carol, group):
    with carol.ws() as carol_ws:
        alice.delete(f"/api/conversations/{group}/members/{carol.id}")
        assert receive_until(carol_ws, "conversation.removed") == {"conversationId": group}


def test_new_direct_chat_is_only_pushed_when_the_first_message_is_sent(alice, bob):
    with bob.ws() as bob_ws:
        conversation_id = alice.post("/api/conversations/direct", json={"userId": bob.id}).json()[
            "id"
        ]
        alice.send(conversation_id, "first!")
        # The first event Bob gets is the chat itself, then its message.
        first = bob_ws.receive_json()
        while first["type"] == "presence":
            first = bob_ws.receive_json()
        assert first["type"] == "conversation.updated" and first["data"]["id"] == conversation_id
        assert receive_until(bob_ws, "message.created")["body"] == "first!"
