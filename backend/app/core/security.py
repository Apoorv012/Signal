import hashlib
import secrets


def generate_token() -> str:
    """Opaque bearer token handed to the client on login."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Only the hash is stored, so a leaked database does not leak live sessions."""
    return hashlib.sha256(token.encode()).hexdigest()
