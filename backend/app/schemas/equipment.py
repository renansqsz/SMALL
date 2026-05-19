from __future__ import annotations

from pydantic import BaseModel, Field


class EquipmentPayload(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    serialNumber: str = Field(min_length=1)
    totalQuantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    location: str = Field(min_length=1)
    entryDate: str = Field(min_length=1)


class EquipmentAssignmentRequest(BaseModel):
    employeeId: int = Field(ge=1)
    quantity: int = Field(ge=1)
    office: str = Field(min_length=1)
