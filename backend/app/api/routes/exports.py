from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from backend.app.api.dependencies import require_auth
from backend.app.services import legacy_services

router = APIRouter(prefix="/exports", tags=["exports"], dependencies=[Depends(require_auth)])


def _excel_response(data: bytes, file_name: str) -> StreamingResponse:
    return StreamingResponse(
        BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@router.get("/equipments")
def export_equipments() -> StreamingResponse:
    return _excel_response(legacy_services.export_equipments_report(), "equipments.xlsx")


@router.get("/notebooks")
def export_notebooks() -> StreamingResponse:
    return _excel_response(legacy_services.export_notebooks_report(), "notebooks.xlsx")


@router.get("/employees")
def export_employees() -> StreamingResponse:
    return _excel_response(legacy_services.export_employees_report(), "employees.xlsx")
