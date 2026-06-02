from __future__ import annotations

from dataclasses import dataclass
import socket


def _default_cors_origins() -> tuple[str, ...]:
    origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    }

    try:
        _, _, addresses = socket.gethostbyname_ex(socket.gethostname())
        for address in addresses:
            if not address.startswith("127."):
                origins.add(f"http://{address}:3000")
    except OSError:
        pass

    return tuple(sorted(origins))


@dataclass(frozen=True)
class Settings:
    app_name: str = "Portal Campsoft"
    api_prefix: str = "/api/v1"
    cors_origins: tuple[str, ...] = _default_cors_origins()
    session_cookie_name: str = "campsoft_session"
    session_ttl_hours: int = 12
    remember_session_ttl_days: int = 14


settings = Settings()
