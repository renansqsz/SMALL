from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, HTTPException, status

from backend.app.core.security import SESSION_COOKIE_NAME, get_session


def require_auth(
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict[str, int | str]:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado.",
        )

    session = get_session(session_token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada ou inválida.",
        )

    return session
