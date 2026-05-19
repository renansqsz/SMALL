from __future__ import annotations

from backend.app.db import database

legacy = database.legacy_services


def authenticate_user(username: str, password: str) -> dict | None:
    normalized_username = username.strip()
    if not normalized_username:
        return None
    return legacy.verify_user(normalized_username, password)


def get_dashboard_stats() -> dict[str, int]:
    return legacy.get_dashboard_stats()


def list_categories() -> list[dict]:
    return legacy.list_categories()


def create_category(name: str) -> dict:
    return legacy.create_category(name)


def delete_category(category_id: int) -> None:
    legacy.delete_category(category_id)


def list_offices() -> list[str]:
    return legacy.list_offices()


def list_employees() -> list[dict]:
    return legacy.list_employees()


def upsert_employee(payload: dict) -> dict:
    return legacy.upsert_employee(payload)


def delete_employee(employee_id: int) -> None:
    legacy.delete_employee(employee_id)


def list_employees_with_assignments() -> list[dict]:
    return legacy.list_employees_with_assignments()


def list_equipments() -> list[dict]:
    return legacy.list_equipments()


def upsert_equipment(payload: dict) -> dict:
    return legacy.upsert_equipment(payload)


def delete_equipment(equipment_id: int) -> None:
    legacy.delete_equipment(equipment_id)


def assign_equipment(equipment_id: int, employee_id: int, quantity: int, office: str) -> dict:
    return legacy.assign_equipment(equipment_id, employee_id, quantity, office)


def get_equipment_history(equipment_id: int) -> list[dict]:
    return legacy.get_equipment_history(equipment_id)


def list_notebooks() -> list[dict]:
    return legacy.list_notebooks()


def upsert_notebook(payload: dict) -> dict:
    return legacy.upsert_notebook(payload)


def delete_notebook(notebook_id: int) -> None:
    legacy.delete_notebook(notebook_id)


def unassign_all(employee_id: int) -> None:
    legacy.unassign_all(employee_id)


def unassign_item(employee_id: int, equipment_id: int, quantity: int) -> None:
    legacy.unassign_item(employee_id, equipment_id, quantity)


def export_equipments_report() -> bytes:
    return legacy.export_equipments_report()


def export_notebooks_report() -> bytes:
    return legacy.export_notebooks_report()


def export_employees_report() -> bytes:
    return legacy.export_employees_report()
