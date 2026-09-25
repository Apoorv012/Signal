import hashlib
import hmac
import secrets

_PBKDF2_ROUNDS = 240_000


def generate_token() -> str:
    """Opaque bearer token handed to the client on login."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Only the hash is stored, so a leaked database does not leak live sessions."""
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    """Salted PBKDF2-SHA256, stored as "pbkdf2$rounds$salt$hash" (hex)."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2${_PBKDF2_ROUNDS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, rounds, salt, expected = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds))
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), expected)
