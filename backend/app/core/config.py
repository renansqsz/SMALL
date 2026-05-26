from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "Portal Campsoft"
    api_prefix: str = "/api/v1"
    cors_origins: tuple[str, ...] = ("http://localhost:3000", "http://127.0.0.1:3000")
    session_cookie_name: str = "campsoft_session"
    session_ttl_hours: int = 12
    remember_session_ttl_days: int = 14


settings = Settings()
