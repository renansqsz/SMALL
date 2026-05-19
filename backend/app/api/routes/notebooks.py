from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.dependencies import require_auth
from backend.app.schemas.notebook import NotebookPayload
from backend.app.services import legacy_services

router = APIRouter(prefix="/notebooks", tags=["notebooks"], dependencies=[Depends(require_auth)])


@router.get("")
def list_notebooks() -> list[dict]:
    return legacy_services.list_notebooks()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_notebook(payload: NotebookPayload) -> dict:
    try:
        return legacy_services.upsert_notebook(payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.put("/{notebook_id}")
def update_notebook(notebook_id: int, payload: NotebookPayload) -> dict:
    data = payload.model_dump()
    data["id"] = notebook_id
    try:
        return legacy_services.upsert_notebook(data)
    except ValueError as error:
        status_code = status.HTTP_404_NOT_FOUND if "nao encontrado" in str(error).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(error)) from error


@router.delete("/{notebook_id}")
def delete_notebook(notebook_id: int) -> dict[str, str]:
    try:
        legacy_services.delete_notebook(notebook_id)
        return {"detail": "Notebook excluído com sucesso."}
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
