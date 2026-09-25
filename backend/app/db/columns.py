"""Adds columns introduced after a database was first created.

`Base.metadata.create_all` creates missing tables but never alters existing ones, so columns added
later are applied here (idempotent). A fresh database already has them and is untouched.
"""

from sqlalchemy import Engine, inspect, text

# (table, column, SQLite column definition)
ADDED_COLUMNS = [
    ("conversation_members", "cleared_at", "DATETIME"),
    ("conversation_members", "marked_unread", "BOOLEAN NOT NULL DEFAULT 0"),
]


def add_missing_columns(engine: Engine) -> None:
    existing = {
        table: {c["name"] for c in inspect(engine).get_columns(table)}
        for table, *_ in ADDED_COLUMNS
    }
    with engine.begin() as connection:
        for table, column, definition in ADDED_COLUMNS:
            if column not in existing[table]:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
