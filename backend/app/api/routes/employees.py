from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import require_auth
from backend.app.schemas.employee import EmployeePayload, UnassignItemRequest
from backend.app.services import legacy_services

router = APIRouter(prefix="/employees", tags=["employees"], dependencies=[Depends(require_auth)])


@router.get("")
def list_employees() -> list[dict]:
    return legacy_services.list_employees_with_assignments()


@router.get("/base")
def list_base_employees() -> list[dict[str, int | str]]:
    return legacy_services.list_employees()


@router.get("/offices")
def list_offices() -> list[str]:
    return legacy_services.list_offices()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeePayload) -> dict[str, int | str]:
    try:
        return legacy_services.upsert_employee(payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put("/{employee_id}")
def update_employee(employee_id: int, payload: EmployeePayload) -> dict[str, int | str]:
    data = payload.model_dump()
    data["id"] = employee_id
    try:
        return legacy_services.upsert_employee(data)
    except ValueError as error:
        status_code = status.HTTP_404_NOT_FOUND if "nao encontrado" in str(error).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(error)) from error


@router.delete("/{employee_id}")
def delete_employee(employee_id: int) -> dict[str, str]:
    try:
        legacy_services.delete_employee(employee_id)
        return {"detail": "Colaborador excluído com sucesso."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/{employee_id}/unassign")
def unassign_item(employee_id: int, payload: UnassignItemRequest) -> dict[str, str]:
    try:
        legacy_services.unassign_item(employee_id, payload.equipmentId, payload.quantity)
        return {"detail": "Item desvinculado com sucesso."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/{employee_id}/unassign-all")
def unassign_all(employee_id: int) -> dict[str, str]:
    try:
        legacy_services.unassign_all(employee_id)
        return {"detail": "Todos os itens do colaborador foram desvinculados."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
