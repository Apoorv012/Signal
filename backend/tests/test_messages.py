import io

from PIL import Image


def png_bytes(width: int = 40, height: int = 20) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), "blue").save(buffer, format="PNG")
    return buffer.getvalue()


def test_send_and_list_messages(alice, bob, dm):
    sent = alice.send(dm, "hello")
    assert sent.status_code == 201
    assert sent.json()["body"] == "hello"
    listed = bob.get(f"/api/conversations/{dm}/messages").json()
    assert [m["body"] for m in listed] == ["hello"]


def test_sending_is_idempotent_on_client_id(alice, dm):
    first = alice.send(dm, "once", client_id="abc").json()
    second = alice.send(dm, "once", client_id="abc").json()
    assert first["id"] == second["id"]
    assert len(alice.get(f"/api/conversations/{dm}/messages").json()) == 1


def test_empty_messages_are_rejected(alice, dm):
    assert alice.send(dm, "   ").status_code == 400


def test_cursor_pagination(alice, dm):
    ids = [alice.send(dm, f"m{i}").json()["id"] for i in range(5)]
    newest = alice.get(f"/api/conversations/{dm}/messages", params={"limit": 2}).json()
    assert [m["id"] for m in newest] == ids[3:]
    older = alice.get(
        f"/api/conversations/{dm}/messages", params={"limit": 2, "before": ids[3]}
    ).json()
    assert [m["id"] for m in older] == ids[1:3]


def test_unread_counts_and_mark_read(alice, bob, dm):
    for i in range(3):
        alice.send(dm, f"m{i}")
    listing = {c["id"]: c for c in bob.get("/api/conversations").json()}
    assert listing[dm]["unreadCount"] == 3
    assert {c["id"]: c for c in alice.get("/api/conversations").json()}[dm]["unreadCount"] == 0

    last_id = bob.get(f"/api/conversations/{dm}/messages").json()[-1]["id"]
    assert (
        bob.post(f"/api/conversations/{dm}/read", json={"upToMessageId": last_id}).status_code
        == 204
    )
    assert {c["id"]: c for c in bob.get("/api/conversations").json()}[dm]["unreadCount"] == 0


def test_receipt_status_progresses_sent_delivered_read(alice, bob, dm):
    sent = alice.send(dm, "status?").json()
    assert sent["status"] == "sent"  # Bob is offline

    with bob.ws():  # coming online delivers everything pending
        pass
    status = alice.get(f"/api/conversations/{dm}/messages").json()[-1]["status"]
    assert status == "delivered"

    bob.post(f"/api/conversations/{dm}/read", json={"upToMessageId": sent["id"]})
    assert alice.get(f"/api/conversations/{dm}/messages").json()[-1]["status"] == "read"


def test_group_message_is_read_only_when_everyone_has_read_it(alice, bob, carol, group):
    sent = alice.send(group, "all hands").json()
    bob.post(f"/api/conversations/{group}/read", json={"upToMessageId": sent["id"]})
    assert alice.get(f"/api/conversations/{group}/messages").json()[-1]["status"] != "read"
    carol.post(f"/api/conversations/{group}/read", json={"upToMessageId": sent["id"]})
    assert alice.get(f"/api/conversations/{group}/messages").json()[-1]["status"] == "read"


def test_reply_must_quote_a_message_from_the_same_conversation(alice, bob, dm, group):
    original = alice.send(dm, "question").json()
    reply = bob.send(dm, "answer", replyToId=original["id"]).json()
    assert reply["replyTo"] == {"id": original["id"], "senderName": "Alice", "preview": "question"}
    assert alice.send(group, "wrong place", replyToId=original["id"]).status_code == 400


def test_reactions_replace_and_aggregate(alice, bob, dm):
    message = alice.send(dm, "react").json()
    url = f"/api/messages/{message['id']}/reaction"
    bob.put(url, json={"emoji": "👍"})
    alice.put(url, json={"emoji": "👍"})
    reactions = bob.put(url, json={"emoji": "❤️"}).json()["reactions"]  # replaces Bob's 👍
    by_emoji = {r["emoji"]: r for r in reactions}
    assert by_emoji["👍"]["count"] == 1 and by_emoji["👍"]["reactedByMe"] is False
    assert by_emoji["❤️"]["count"] == 1 and by_emoji["❤️"]["reactedByMe"] is True
    assert bob.delete(url).json()["reactions"][0]["emoji"] == "👍"


def test_new_group_members_do_not_see_earlier_history(alice, bob, carol, client, group):
    alice.send(group, "before dave")
    dave = client.post(
        "/api/auth/verify-otp", json={"phone": "+15550001004", "code": "123456"}
    ).json()
    alice.post(f"/api/conversations/{group}/members", json={"userIds": [dave["user"]["id"]]})
    headers = {"Authorization": f"Bearer {dave['token']}"}
    messages = client.get(f"/api/conversations/{group}/messages", headers=headers).json()
    assert "before dave" not in [m["body"] for m in messages]


def test_image_attachment_flow(alice, bob, dm):
    upload = alice.post("/api/attachments", files={"file": ("pic.png", png_bytes(), "image/png")})
    assert upload.status_code == 201
    attachment = upload.json()
    assert (attachment["width"], attachment["height"]) == (40, 20)

    message = alice.send(dm, "", attachmentId=attachment["id"]).json()
    assert message["kind"] == "image"
    assert message["attachment"]["fileName"] == "pic.png"
    # An attachment can only be sent once, and only by its uploader.
    assert alice.send(dm, "again", attachmentId=attachment["id"]).status_code == 400
    other = bob.post("/api/attachments", files={"file": ("a.txt", b"x", "text/plain")}).json()
    assert alice.send(dm, "steal", attachmentId=other["id"]).status_code == 404


def test_file_and_audio_attachment_kinds(alice, dm):
    pdf = alice.post(
        "/api/attachments", files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")}
    )
    sent_pdf = alice.send(dm, "", client_id="pdf", attachmentId=pdf.json()["id"])
    assert sent_pdf.json()["kind"] == "file"
    audio = alice.post(
        "/api/attachments",
        files={"file": ("v.webm", b"abc", "audio/webm")},
        data={"durationSec": "12"},
    )
    message = alice.send(dm, "", client_id="audio", attachmentId=audio.json()["id"]).json()
    assert message["kind"] == "voice" and message["attachment"]["durationSec"] == 12


def test_uploaded_files_are_served_from_media(client, alice):
    upload = alice.post(
        "/api/attachments", files={"file": ("pic.png", png_bytes(), "image/png")}
    ).json()
    served = client.get(upload["url"])
    assert served.status_code == 200
    assert served.content == png_bytes()


def test_empty_upload_is_rejected(alice):
    assert (
        alice.post("/api/attachments", files={"file": ("e.txt", b"", "text/plain")}).status_code
        == 400
    )


def test_avatar_upload_must_be_an_image(alice):
    bad = alice.post("/api/me/avatar", files={"file": ("a.txt", b"nope", "text/plain")})
    assert bad.status_code == 400
    good = alice.post("/api/me/avatar", files={"file": ("a.png", png_bytes(), "image/png")})
    assert good.json()["avatarUrl"].startswith("/media/avatars/")


def test_disappearing_messages_expire(alice, bob, dm):
    from datetime import timedelta

    from app.core.clock import utcnow
    from app.db.session import session_scope
    from app.models import Message

    alice.patch(f"/api/conversations/{dm}", json={"disappearingSeconds": 60})
    message = alice.send(dm, "secret").json()
    assert message["expiresAt"] is not None

    with session_scope() as db:  # fast-forward: pretend the timer already ran out
        db.get(Message, message["id"]).expires_at = utcnow() - timedelta(seconds=1)
        db.commit()
    bodies = [m["body"] for m in bob.get(f"/api/conversations/{dm}/messages").json()]
    assert "secret" not in bodies


def test_search_is_case_insensitive_and_newest_first(alice, bob, dm):
    first = alice.send(dm, "Lunch at noon").json()["id"]
    alice.send(dm, "something else")
    second = bob.send(dm, "no LUNCH today").json()["id"]
    found = alice.get("/api/messages/search", params={"q": "lunch"}).json()
    assert [m["id"] for m in found] == [second, first]
    assert found[0]["conversationId"] == dm


def test_search_can_be_scoped_to_one_conversation(alice, bob, carol, dm, group):
    alice.send(dm, "pizza in dm")
    alice.send(group, "pizza in group")
    everywhere = alice.get("/api/messages/search", params={"q": "pizza"}).json()
    assert len(everywhere) == 2
    scoped = alice.get("/api/messages/search", params={"q": "pizza", "conversationId": dm}).json()
    assert [m["conversationId"] for m in scoped] == [dm]


def test_search_matches_wildcards_literally(alice, dm):
    alice.send(dm, "100% sure")
    alice.send(dm, "plain text")
    assert len(alice.get("/api/messages/search", params={"q": "%"}).json()) == 1
    assert alice.get("/api/messages/search", params={"q": "_"}).json() == []


def test_search_never_returns_other_peoples_chats(alice, bob, carol, dm):
    alice.send(dm, "secret plan")
    assert carol.get("/api/messages/search", params={"q": "secret"}).json() == []
    denied = carol.get("/api/messages/search", params={"q": "secret", "conversationId": dm})
    assert denied.status_code == 403


def test_search_skips_system_messages(alice, bob, carol, group):
    alice.send(group, "hello team")
    hits = alice.get("/api/messages/search", params={"q": "hello"}).json()
    assert [m["body"] for m in hits] == ["hello team"]
