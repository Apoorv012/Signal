from datetime import UTC, datetime


def utcnow() -> datetime:
    """Timezone-aware current time. All timestamps in the app are UTC."""
    return datetime.now(UTC)
