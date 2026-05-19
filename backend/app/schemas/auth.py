from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class AuthUser(BaseModel):
    id: int
    username: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    remember_me: bool = False

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_identifier(cls, value: object) -> object:
        if not isinstance(value, dict):
            return value

        normalized = dict(value)
        if not normalized.get("username"):
            legacy_identifier = (
                normalized.get("identifier")
                or normalized.get("email")
                or normalized.get("user")
                or normalized.get("login")
            )
            if legacy_identifier:
                normalized["username"] = legacy_identifier

        if "remember_me" not in normalized and "rememberMe" in normalized:
            normalized["remember_me"] = normalized["rememberMe"]
        return normalized


class SessionResponse(BaseModel):
    user: AuthUser
