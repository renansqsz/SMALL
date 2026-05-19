from __future__ import annotations

from pathlib import Path
import sqlite3
import sys

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from python_app import services as legacy_services  # noqa: E402


def init_database() -> None:
    legacy_services.init_db()
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tokenHash TEXT UNIQUE NOT NULL,
                userId INTEGER NOT NULL,
                username TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                expiresAt TEXT NOT NULL
            )
            """
        )


def get_connection() -> sqlite3.Connection:
    return legacy_services.get_connection()
