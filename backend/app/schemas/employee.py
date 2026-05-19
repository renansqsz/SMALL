from __future__ import annotations

from pydantic import BaseModel, Field


class EmployeePayload(BaseModel):
    nome: str = Field(min_length=1)
    escritorio: str = Field(min_length=1)


class UnassignItemRequest(BaseModel):
    equipmentId: int
    quantity: int = Field(ge=1)
