from __future__ import annotations

from pydantic import BaseModel, Field


class NotebookPayload(BaseModel):
    brand: str = Field(min_length=1)
    model: str = Field(min_length=1)
    serialNumber: str = ""
    processor: str = ""
    gpu: str = ""
    screenSize: str = ""
    ramTotal: int = Field(ge=1)
    ramSticks: int = Field(ge=1)
    storageType: str = Field(min_length=1)
    storageCapacity: str = Field(min_length=1)
    condition: str = Field(min_length=1)
    location: str = Field(min_length=1)
    status: str = Field(min_length=1)
    entryDate: str = Field(min_length=1)
