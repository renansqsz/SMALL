from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.app.api.dependencies import require_auth
from backend.app.schemas.dashboard import DashboardStatsResponse
from backend.app.services import legacy_services

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_auth)])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_stats() -> DashboardStatsResponse:
    return DashboardStatsResponse(**legacy_services.get_dashboard_stats())
