from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import require_auth
from backend.app.schemas.equipment import EquipmentAssignmentRequest, EquipmentPayload
from backend.app.services import legacy_services

router = APIRouter(prefix="/equipments", tags=["equipments"], dependencies=[Depends(require_auth)])


@router.get("")
def list_equipments() -> list[dict]:
    return legacy_services.list_equipments()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_equipment(payload: EquipmentPayload) -> dict:
    try:
        return legacy_services.upsert_equipment(payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put("/{equipment_id}")
def update_equipment(equipment_id: int, payload: EquipmentPayload) -> dict:
    data = payload.model_dump()
    data["id"] = equipment_id
    try:
        return legacy_services.upsert_equipment(data)
    except ValueError as error:
        status_code = status.HTTP_404_NOT_FOUND if "nao encontrado" in str(error).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(error)) from error


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int) -> dict[str, str]:
    try:
        legacy_services.delete_equipment(equipment_id)
        return {"detail": "Equipamento excluído com sucesso."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/{equipment_id}/assign")
def assign_equipment(equipment_id: int, payload: EquipmentAssignmentRequest) -> dict:
    try:
        return legacy_services.assign_equipment(
            equipment_id=equipment_id,
            employee_id=payload.employeeId,
            quantity=payload.quantity,
            office=payload.office,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/{equipment_id}/history")
def equipment_history(equipment_id: int) -> list[dict]:
    return legacy_services.get_equipment_history(equipment_id)
