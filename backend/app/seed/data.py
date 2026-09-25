"""Static definitions for seeded accounts (all use the fixed OTP)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class SeedUser:
    key: str
    phone: str
    name: str
    avatar: str  # file stem in seed/media
    username: str | None = None
    about: str = ""


USERS: list[SeedUser] = [
    SeedUser("riley", "+15550000001", "Riley Chen", "me", "riley", "Hey there! I am using Signal."),
    SeedUser("maya", "+15550000002", "Maya Johnson", "maya", "maya", "Coffee first."),
    SeedUser("paige", "+15550000003", "Paige Hall", "paige", "paige", "Baking things."),
    SeedUser("mom", "+15550000004", "Mom", "mom", None, "Call me."),
    SeedUser("julian", "+15550000005", "Julian Rocha", "julian", "julian", ""),
    SeedUser("kai", "+15550000006", "Kai Guo", "kai", "kai", "Working late."),
    SeedUser("michael", "+15550000007", "Michael Lundberg", "michael", "michael", "Climbing."),
]

PDF_NAME = "Family Tree & Stories.pdf"
