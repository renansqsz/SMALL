from __future__ import annotations

from datetime import UTC, datetime, timedelta
import hashlib
import secrets

from fastapi import Response

from backend.app.core.config import settings
from backend.app.db.database import get_connection

SESSION_COOKIE_NAME = settings.session_cookie_name


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _cleanup_expired_sessions() -> None:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE expiresAt <= ?",
            (datetime.now(UTC).isoformat(),),
        )


def create_session(user_id: int, username: str, remember_me: bool = False) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    ttl = timedelta(days=settings.remember_session_ttl_days) if remember_me else timedelta(hours=settings.session_ttl_hours)
    expires_at = datetime.now(UTC) + ttl
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO sessions (tokenHash, userId, username, createdAt, expiresAt)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                _hash_token(token),
                int(user_id),
                username,
                datetime.now(UTC).isoformat(),
                expires_at.isoformat(),
            ),
        )
    return token, expires_at


def get_session(token: str) -> dict[str, int | str] | None:
    _cleanup_expired_sessions()
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT userId, username
            FROM sessions
            WHERE tokenHash = ? AND expiresAt > ?
            """,
            (_hash_token(token), datetime.now(UTC).isoformat()),
        ).fetchone()
    if not row:
        return None
    return {"id": int(row["userId"]), "username": str(row["username"])}


def delete_session(token: str) -> None:
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE tokenHash = ?",
            (_hash_token(token),),
        )


def set_session_cookie(response: Response, token: str, expires_at: datetime) -> None:
    max_age = int((expires_at - datetime.now(UTC)).total_seconds())
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=max_age,
        expires=expires_at,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
