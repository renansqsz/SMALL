from __future__ import annotations

from pydantic import BaseModel, Field


class EquipmentPayload(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    brand: str = ""
    model: str = ""
    serialNumber: str = ""
    totalQuantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    location: str = Field(min_length=1)
    entryDate: str = Field(min_length=1)


class EquipmentAssignmentRequest(BaseModel):
    employeeId: int
    quantity: int = Field(ge=1)
    office: str = Field(min_length=1)
