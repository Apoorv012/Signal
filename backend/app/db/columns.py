"""Adds columns introduced after a database was first created.

`Base.metadata.create_all` creates missing tables but never alters existing ones, so columns added
later are applied here (idempotent). A fresh database already has them and is untouched.
"""

from sqlalchemy import Engine, inspect, text

# (table, column, SQLite column definition)
ADDED_COLUMNS = [
    ("conversation_members", "cleared_at", "DATETIME"),
    ("conversation_members", "marked_unread", "BOOLEAN NOT NULL DEFAULT 0"),
    ("conversation_members", "safety_verified", "BOOLEAN NOT NULL DEFAULT 0"),
    ("users", "password_hash", "VARCHAR(255)"),
    ("users", "identity_key", "VARCHAR(64)"),
    ("sessions", "device_name", "VARCHAR(80)"),
    ("sessions", "last_active_at", "DATETIME"),
]


def add_missing_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    existing = {
        table: {c["name"] for c in inspector.get_columns(table)}
        for table in {table for table, *_ in ADDED_COLUMNS}
        if inspector.has_table(table)
    }
    with engine.begin() as connection:
        for table, column, definition in ADDED_COLUMNS:
            if table in existing and column not in existing[table]:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
    make_phone_nullable(engine)


def make_phone_nullable(engine: Engine) -> None:
    """Username accounts have no phone, but old databases declared `users.phone NOT NULL`.

    SQLite cannot drop a NOT NULL constraint in place, so the table is rebuilt (SQLite's documented
    procedure: copy the rows aside, drop, recreate from the current model, copy back) inside one
    transaction with foreign keys switched off, and verified before it is committed.
    """
    from sqlalchemy.dialects import sqlite
    from sqlalchemy.schema import CreateIndex, CreateTable

    from app.models import User

    if engine.url.get_backend_name() != "sqlite":
        return
    raw = engine.raw_connection()
    try:
        connection = raw.driver_connection
        connection.isolation_level = None  # manual BEGIN/COMMIT so PRAGMA and DDL behave
        cursor = connection.cursor()
        info = cursor.execute("PRAGMA table_info(users)").fetchall()
        phone = next((row for row in info if row[1] == "phone"), None)
        if phone is None or not phone[3]:  # row[3] == "notnull"
            return
        columns = ", ".join(row[1] for row in info)
        dialect = sqlite.dialect()

        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.execute("BEGIN")
        try:
            cursor.execute(f"CREATE TABLE users_backup AS SELECT {columns} FROM users")
            cursor.execute("DROP TABLE users")
            cursor.execute(str(CreateTable(User.__table__).compile(dialect=dialect)))
            for index in User.__table__.indexes:
                cursor.execute(str(CreateIndex(index).compile(dialect=dialect)))
            cursor.execute(f"INSERT INTO users ({columns}) SELECT {columns} FROM users_backup")
            cursor.execute("DROP TABLE users_backup")
            if cursor.execute("PRAGMA foreign_key_check").fetchall():
                raise RuntimeError("users table rebuild would break foreign keys")
            cursor.execute("COMMIT")
        except Exception:
            cursor.execute("ROLLBACK")
            raise
        finally:
            cursor.execute("PRAGMA foreign_keys=ON")
    finally:
        connection.isolation_level = ""  # back to pysqlite's default before the pool reuses it
        raw.close()
