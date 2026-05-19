from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from backend.app.core.security import (
    SESSION_COOKIE_NAME,
    clear_session_cookie,
    create_session,
    delete_session,
    get_session,
    set_session_cookie,
)
from backend.app.schemas.auth import LoginRequest, SessionResponse
from backend.app.services import legacy_services

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=SessionResponse)
def login(payload: LoginRequest, response: Response) -> SessionResponse:
    user = legacy_services.authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )

    session_token, expires_at = create_session(
        user_id=int(user["id"]),
        username=str(user["username"]),
        remember_me=payload.remember_me,
    )
    set_session_cookie(response, session_token, expires_at)
    return SessionResponse(user={"id": int(user["id"]), "username": str(user["username"])})


@router.get("/me", response_model=SessionResponse)
def me(
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> SessionResponse:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado.")
    session = get_session(session_token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada ou inválida.")

    return SessionResponse(user={"id": int(session["id"]), "username": str(session["username"])})


@router.post("/logout")
def logout(
    response: Response,
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict[str, str]:
    if session_token:
        delete_session(session_token)
    clear_session_cookie(response)
    return {"detail": "Sessão encerrada com sucesso."}
