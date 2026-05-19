from __future__ import annotations

from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    totalItems: int
    inStock: int
    outOfStock: int
    totalEmployees: int
    totalNotebooks: int
    assignedItems: int
