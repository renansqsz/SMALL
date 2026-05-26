from __future__ import annotations

from pydantic import BaseModel, Field


class NotebookPayload(BaseModel):
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    serialNumber: str = Field(min_length=1)
    processor: str = Field(min_length=1)
    gpu: str = Field(min_length=1)
    screenSize: str = Field(min_length=1)
    ramTotal: int = Field(ge=0)
    ramSticks: int = Field(ge=0)
    storageType: str = Field(min_length=1)
    storageCapacity: str = Field(min_length=1)
    condition: str = Field(min_length=1)
    location: str = Field(min_length=1)
    status: str = Field(min_length=1)
    entryDate: str = Field(min_length=1)
