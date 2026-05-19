from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import require_auth
from backend.app.schemas.category import CategoryCreateRequest
from backend.app.services import legacy_services

router = APIRouter(prefix="/categories", tags=["categories"], dependencies=[Depends(require_auth)])


@router.get("")
def list_categories() -> list[dict[str, int | str]]:
    return legacy_services.list_categories()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreateRequest) -> dict[str, int | str]:
    try:
        return legacy_services.create_category(payload.name)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{category_id}")
def delete_category(category_id: int) -> dict[str, str]:
    try:
        legacy_services.delete_category(category_id)
        return {"detail": "Categoria excluída com sucesso."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
