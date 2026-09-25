"""Disappearing messages: hidden when expired, then physically purged by the sweep."""

from datetime import timedelta

from app.core.clock import utcnow
from app.db.session import session_scope
from app.models import Attachment, Message
from app.services.expiry_service import purge_expired
from tests.test_messages import png_bytes


def _set_timer(account, conversation_id, seconds):
    return account.patch(
        f"/api/conversations/{conversation_id}", json={"disappearingSeconds": seconds}
    )


def _expire(message_id):
    with session_scope() as db:
        db.get(Message, message_id).expires_at = utcnow() - timedelta(seconds=1)
        db.commit()


def test_direct_chats_can_set_a_timer_that_stamps_new_messages(alice, bob, dm):
    assert _set_timer(bob, dm, 3600).status_code == 200  # either person can change it
    message = alice.send(dm, "will vanish").json()
    assert message["expiresAt"] is not None
    assert alice.get(f"/api/conversations/{dm}").json()["disappearingSeconds"] == 3600
    _set_timer(alice, dm, 0)
    assert alice.send(dm, "stays").json()["expiresAt"] is None


def test_expired_messages_disappear_from_history_search_and_preview(alice, bob, dm):
    _set_timer(alice, dm, 3600)
    gone = alice.send(dm, "secret plan").json()["id"]
    _set_timer(alice, dm, 0)
    alice.send(dm, "still here")
    _expire(gone)
    assert [
        m["body"]
        for m in bob.get(f"/api/conversations/{dm}/messages").json()
        if m["kind"] == "text"
    ] == ["still here"]
    assert bob.get("/api/messages/search", params={"q": "secret"}).json() == []


def test_the_sweep_deletes_expired_rows_and_their_files(alice, bob, dm, client):
    _set_timer(alice, dm, 3600)
    upload = alice.post(
        "/api/attachments", files={"file": ("p.png", png_bytes(), "image/png")}
    ).json()
    sent = alice.send(dm, "with picture", attachmentId=upload["id"]).json()
    _set_timer(alice, dm, 0)
    keep = alice.send(dm, "keep").json()["id"]
    _expire(sent["id"])

    with session_scope() as db:
        path = db.get(Attachment, upload["id"]).storage_path
        from app.core.config import settings

        assert (settings.media_dir / path).exists()
        assert purge_expired(db) == 1
        assert db.get(Message, sent["id"]) is None and db.get(Attachment, upload["id"]) is None
        assert db.get(Message, keep) is not None
        assert not (settings.media_dir / path).exists()
        assert purge_expired(db) == 0  # nothing left to do
