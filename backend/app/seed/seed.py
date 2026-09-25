"""Demo data that mirrors Signal's marketing screens, so the app is usable immediately.

Every seeded account logs in with the fixed OTP. Riley Chen (+15550000001) is the main demo user;
sign in as Maya (+15550000002) in a second window to see real-time messaging between two people.
"""

import logging
import shutil
import wave
from datetime import timedelta
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.clock import utcnow
from app.core.config import settings
from app.db.session import session_scope
from app.models import (
    Attachment,
    Contact,
    Conversation,
    ConversationMember,
    ConversationType,
    MemberRole,
    Message,
    MessageKind,
    MessageReceipt,
    Reaction,
    User,
)
from app.seed.data import PDF_NAME, USERS

logger = logging.getLogger(__name__)
SEED_MEDIA = Path(__file__).parent / "media"
MEDIA_PREFIX = "seed"


def _copy_media() -> None:
    target = settings.media_dir / MEDIA_PREFIX
    target.mkdir(parents=True, exist_ok=True)
    for source in SEED_MEDIA.glob("*.jpg"):
        shutil.copyfile(source, target / source.name)

    # A 1-second silent clip stands in for every seeded voice note.
    with wave.open(str(target / "voice.wav"), "wb") as clip:
        clip.setnchannels(1)
        clip.setsampwidth(2)
        clip.setframerate(8000)
        clip.writeframes(b"\x00\x00" * 8000)

    # A minimal, valid PDF padded to ~44 KB (matches the "44KB" file card in the design).
    header = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    header += b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    header += b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    trailer = b"trailer<</Root 1 0 R>>\n%%EOF\n"
    padding = b"% padding\n" * ((44 * 1024 - len(header) - len(trailer)) // 10)
    (target / "family-tree.pdf").write_bytes(header + padding + trailer)


def _create_users(db: Session) -> dict[str, User]:
    users: dict[str, User] = {}
    for spec in USERS:
        user = User(
            phone=spec.phone,
            username=spec.username,
            display_name=spec.name,
            about=spec.about,
            avatar_path=f"{MEDIA_PREFIX}/{spec.avatar}.jpg",
        )
        db.add(user)
        users[spec.key] = user
    db.flush()
    return users


def _new_conversation(
    db: Session,
    kind: ConversationType,
    creator: User,
    members: list[User],
    title: str | None = None,
    avatar: str | None = None,
    disappearing_seconds: int | None = None,
) -> Conversation:
    conversation = Conversation(
        type=kind,
        title=title,
        avatar_path=f"{MEDIA_PREFIX}/{avatar}.jpg" if avatar else None,
        created_by=creator.id,
        disappearing_seconds=disappearing_seconds,
        created_at=utcnow() - timedelta(days=7),
    )
    if kind == ConversationType.DIRECT:
        ids = sorted(u.id for u in members)
        conversation.direct_key = f"{ids[0]}:{ids[1]}"
    week_ago = utcnow() - timedelta(days=7)
    for user in members:
        role = MemberRole.ADMIN if user.id == creator.id else MemberRole.MEMBER
        conversation.members.append(
            ConversationMember(user_id=user.id, role=role, joined_at=week_ago)
        )
    db.add(conversation)
    db.flush()
    return conversation


def _say(
    db: Session,
    conversation: Conversation,
    sender: User | None,
    minutes_ago: float,
    body: str = "",
    kind: MessageKind = MessageKind.TEXT,
    attachment: dict | None = None,
    reactions: dict[str, User] | None = None,
) -> Message:
    """Adds a message with fully-read receipts. `reactions` maps emoji -> reacting user."""
    created = utcnow() - timedelta(minutes=minutes_ago)
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender.id if sender else None,
        kind=kind,
        body=body,
        created_at=created,
    )
    db.add(message)
    db.flush()

    if sender is not None:
        for member in conversation.members:
            if member.user_id != sender.id:
                db.add(
                    MessageReceipt(
                        message_id=message.id,
                        user_id=member.user_id,
                        delivered_at=created + timedelta(seconds=5),
                        read_at=created + timedelta(minutes=1),
                    )
                )
    if attachment:
        assert sender is not None  # system messages never carry attachments
        db.add(Attachment(uploader_id=sender.id, message_id=message.id, **attachment))
    for emoji, user in (reactions or {}).items():
        db.add(Reaction(message_id=message.id, user_id=user.id, emoji=emoji))

    conversation.last_message_at = max(conversation.last_message_at, created)
    db.flush()
    return message


def _mark_all_read(db: Session, conversation: Conversation) -> None:
    latest = db.scalar(
        select(func.max(Message.id)).where(Message.conversation_id == conversation.id)
    )
    for member in conversation.members:
        member.last_read_message_id = latest


def _leave_unread(db: Session, conversation: Conversation, user: User, count: int) -> None:
    """Makes the last `count` messages from others unread for `user` (marker + receipts)."""
    others = list(
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation.id, Message.sender_id != user.id)
            .where(Message.sender_id.is_not(None))
            .order_by(Message.id.desc())
            .limit(count)
        )
    )
    first_unread = min(m.id for m in others)
    member = next(m for m in conversation.members if m.user_id == user.id)
    member.last_read_message_id = first_unread - 1
    for message in others:
        for receipt in message.receipts:
            if receipt.user_id == user.id:
                receipt.read_at = None


def _photo(name: str, width: int, height: int, label: str) -> dict:
    return {
        "file_name": f"{label}.jpg",
        "mime_type": "image/jpeg",
        "size_bytes": (settings.media_dir / MEDIA_PREFIX / f"{name}.jpg").stat().st_size,
        "storage_path": f"{MEDIA_PREFIX}/{name}.jpg",
        "width": width,
        "height": height,
    }


def _voice(seconds: int) -> dict:
    return {
        "file_name": "voice-message.wav",
        "mime_type": "audio/wav",
        "size_bytes": (settings.media_dir / MEDIA_PREFIX / "voice.wav").stat().st_size,
        "storage_path": f"{MEDIA_PREFIX}/voice.wav",
        "duration_sec": seconds,
    }


def _populate(db: Session, u: dict[str, User]) -> None:
    riley = u["riley"]

    # Address book of the main demo user.
    for key in ("maya", "paige", "mom", "julian", "kai", "michael"):
        db.add(Contact(owner_id=riley.id, contact_id=u[key].id))

    # --- Family (pinned, crimson bubbles) ---
    family = _new_conversation(
        db, ConversationType.GROUP, riley, [riley, u["mom"], u["julian"]], "Family", "family"
    )
    _say(
        db,
        family,
        u["mom"],
        15,
        "Dad 1972 LA outside João’s house",
        MessageKind.IMAGE,
        _photo("photo-dad", 900, 600, "dad-1972"),
    )
    _say(db, family, riley, 12, "Remind me, who was João?")
    _say(db, family, u["mom"], 7, "", MessageKind.VOICE, _voice(70), {"❤️": riley})
    _say(
        db,
        family,
        u["julian"],
        3,
        "",
        MessageKind.FILE,
        {
            "file_name": PDF_NAME,
            "mime_type": "application/pdf",
            "size_bytes": 44 * 1024,
            "storage_path": f"{MEDIA_PREFIX}/family-tree.pdf",
        },
    )
    _mark_all_read(db, family)
    _leave_unread(db, family, riley, 2)
    _pin(family, riley, theme="crimson")

    # --- Paige Hall (pinned DM) ---
    paige = _new_conversation(db, ConversationType.DIRECT, riley, [riley, u["paige"]])
    _say(db, paige, u["paige"], 55, "Did you get the invite to the group?")
    _say(db, paige, riley, 45, "Just sent you the link!")
    _say(db, paige, u["paige"], 40, "Yeah, I just got the group link - thanks for adding me 😎")
    _mark_all_read(db, paige)
    _pin(paige, riley)

    # --- Rock climbers ---
    climbers = _new_conversation(
        db,
        ConversationType.GROUP,
        u["michael"],
        [u["michael"], riley, u["kai"]],
        "Rock climbers",
        "climbers",
    )
    _say(db, climbers, u["michael"], 90, "Weather looks perfect for Saturday")
    _say(
        db,
        climbers,
        u["michael"],
        70,
        "Ok, I’m picking everyone up at 8am tomorrow. Be ready to pile into the minivan.",
    )
    _mark_all_read(db, climbers)

    # --- Maya Johnson (disappearing messages: 1 day) ---
    maya = _new_conversation(
        db, ConversationType.DIRECT, riley, [riley, u["maya"]], disappearing_seconds=86_400
    )
    _say(db, maya, riley, 30, "I’m on my way! What’s the address?")
    _say(db, maya, None, 27, "Maya set disappearing message time to 1 day.", MessageKind.SYSTEM)
    _say(db, maya, u["maya"], 25, "We’re at 118 68th Ave.")
    _say(db, maya, riley, 20, "Is there a buzzer? Don’t want to ruin the surprise")
    _say(
        db,
        maya,
        u["maya"],
        18,
        "Buzz 2F if you get here before 7pm otherwise text me and I’ll come down to get you",
        reactions={"💯": riley},
    )
    _say(db, maya, riley, 10, "", MessageKind.VOICE, _voice(92))
    _say(db, maya, u["maya"], 8, "Ok - stay there I’ll come down and grab you in a moment")
    _mark_all_read(db, maya)
    _leave_unread(db, maya, riley, 1)

    # --- Note to Self ---
    note = _new_conversation(db, ConversationType.NOTE_TO_SELF, riley, [riley])
    _say(db, note, riley, 1440, "Groceries: Coffee, yogurt, grapefruit, biscuits")
    _mark_all_read(db, note)

    # --- Roommates ---
    roommates = _new_conversation(
        db,
        ConversationType.GROUP,
        u["kai"],
        [u["kai"], riley, u["paige"]],
        "Roommates",
        "roommates",
    )
    _say(
        db,
        roommates,
        u["kai"],
        1500,
        "Working late - can one of you please feed Spooky? One tin of wet food please.",
    )
    _mark_all_read(db, roommates)

    # --- Winter Soup Club (gradient theme + reactions) ---
    soup = _new_conversation(
        db,
        ConversationType.GROUP,
        riley,
        [riley, u["maya"], u["kai"], u["paige"], u["michael"]],
        "Winter Soup Club 🍲",
        "soup",
    )
    _say(db, soup, u["maya"], 30, "", MessageKind.IMAGE, _photo("photo-soup", 900, 900, "soup"))
    gathering = _say(
        db,
        soup,
        riley,
        25,
        "Monthly soup gathering is here! Next Thursday, 8pm, my house. I’m making the soup so "
        "please come with sweets & sides",
    )
    for emoji, reactor in (
        ("❤️", u["kai"]),
        ("❤️", u["paige"]),
        ("🍲", u["michael"]),
        ("🥄", u["maya"]),
    ):
        db.add(Reaction(message_id=gathering.id, user_id=reactor.id, emoji=emoji))
    _say(db, soup, u["kai"], 21, "I’ll bring bread and make a nice salad")
    _say(db, soup, u["paige"], 18, "I’ve got a matcha mille crêpe recipe to test out 🧑🏾‍🔬")
    _say(
        db, soup, u["michael"], 15, "I’ll bring something fun to drink and will do all the dishes."
    )
    _say(db, soup, riley, 5, "Perfect, see you all in a few days!")
    _mark_all_read(db, soup)
    _set_theme(soup, riley, "soup")


def _pin(conversation: Conversation, user: User, theme: str | None = None) -> None:
    member = next(m for m in conversation.members if m.user_id == user.id)
    member.is_pinned = True
    member.chat_theme = theme


def _set_theme(conversation: Conversation, user: User, theme: str) -> None:
    next(m for m in conversation.members if m.user_id == user.id).chat_theme = theme


def seed_if_empty() -> None:
    """Populates an empty database. Safe to call on every startup."""
    with session_scope() as db:
        if db.scalar(select(func.count(User.id))):
            return
        _copy_media()
        users = _create_users(db)
        _populate(db, users)
        db.commit()
        logger.info("Seeded demo data: %d users", len(users))
