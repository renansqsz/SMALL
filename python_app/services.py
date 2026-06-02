from __future__ import annotations

import html
import re
import sqlite3
from datetime import date, datetime
from email.utils import parsedate_to_datetime
from io import BytesIO
from pathlib import Path
from typing import Any

import bcrypt
import pandas as pd
import requests
from openpyxl.styles import Font, PatternFill


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "inventory.db"

DEFAULT_CATEGORIES = [
    "Mouse",
    "Teclado",
    "Notebook",
    "Monitor",
    "Webcam",
    "TV",
    "Impressora",
    "Outros",
]

DEFAULT_OFFICES = [
    "CampSoft",
    "Tocalivros",
]

TECH_BANNER_IMAGES = [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
]

HTML_ENTITY_MAP = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&mdash;": "-",
    "&ndash;": "-",
    "&hellip;": "...",
}

NEWS_FEED_URL = (
    "https://news.google.com/rss/search"
    "?q=inteligencia+artificial&hl=pt-BR&gl=BR&ceid=BR:pt-419"
)


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 5000")
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(row) for row in rows]


def _row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row else None


def _seed_offices(connection: sqlite3.Connection, offices: list[str]) -> None:
    normalized_offices = [office.strip() for office in offices if office.strip()]
    if not normalized_offices:
        return

    connection.executemany(
        "INSERT OR IGNORE INTO offices (name) VALUES (?)",
        [(office,) for office in dict.fromkeys(normalized_offices)],
    )


def _log_equipment_assignment_event(
    connection: sqlite3.Connection,
    *,
    equipment_id: int,
    equipment_name: str,
    employee_id: int,
    employee_name: str,
    office: str,
    quantity: int,
    movement_type: str,
    created_at: str | None = None,
) -> None:
    connection.execute(
        """
        INSERT INTO equipment_assignments (
            equipmentId,
            equipmentName,
            employeeId,
            employeeName,
            office,
            quantity,
            movementType,
            createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            equipment_id,
            equipment_name,
            employee_id,
            employee_name,
            office,
            quantity,
            movement_type,
            created_at or datetime.utcnow().isoformat(),
        ),
    )


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS equipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                brand TEXT,
                model TEXT,
                serialNumber TEXT,
                totalQuantity INTEGER NOT NULL,
                availableQuantity INTEGER NOT NULL,
                location TEXT,
                entryDate TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS notebooks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand TEXT NOT NULL,
                model TEXT NOT NULL,
                serialNumber TEXT,
                processor TEXT,
                gpu TEXT,
                screenSize TEXT,
                ramTotal INTEGER NOT NULL,
                ramSticks INTEGER,
                storageType TEXT,
                storageCapacity TEXT,
                condition TEXT,
                location TEXT,
                status TEXT NOT NULL,
                entryDate TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS offices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS Funcionarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                escritorio TEXT NOT NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS equipment_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipmentId INTEGER NOT NULL,
                equipmentName TEXT NOT NULL,
                employeeId INTEGER NOT NULL,
                employeeName TEXT NOT NULL,
                office TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                movementType TEXT NOT NULL DEFAULT 'Atribuicao',
                createdAt TEXT NOT NULL
            )
            """
        )

        admin_user = cursor.execute(
            "SELECT id FROM users WHERE username = ?",
            ("admin",),
        ).fetchone()
        if not admin_user:
            hashed_password = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                ("admin", hashed_password),
            )

        categories_count = cursor.execute(
            "SELECT COUNT(*) AS count FROM categories"
        ).fetchone()["count"]
        if categories_count == 0:
            cursor.executemany(
                "INSERT INTO categories (name) VALUES (?)",
                [(category,) for category in DEFAULT_CATEGORIES],
            )

        _seed_offices(connection, DEFAULT_OFFICES)
        existing_offices = cursor.execute(
            """
            SELECT DISTINCT TRIM(escritorio) AS office
            FROM Funcionarios
            WHERE TRIM(escritorio) <> ''
            """
        ).fetchall()
        _seed_offices(connection, [row["office"] for row in existing_offices if row["office"]])
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_funcionarios_escritorio_nome
            ON Funcionarios (escritorio, nome)
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_equipment_assignments_employee_active
            ON equipment_assignments (employeeId, movementType, equipmentId, id)
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment_history
            ON equipment_assignments (equipmentId, createdAt DESC, id DESC)
            """
        )



def verify_user(username: str, password: str) -> dict[str, Any] | None:
    with get_connection() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        ).fetchone()

    if not user:
        return None

    stored_hash = user["password"]
    if not stored_hash or not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
        return None

    return {"id": user["id"], "username": user["username"]}


def calculate_status(available_quantity: int | float) -> str:
    return "Em estoque" if int(available_quantity) > 0 else "Em falta"


def list_categories() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM categories ORDER BY name ASC"
        ).fetchall()
    return _rows_to_dicts(rows)


def create_category(name: str) -> dict[str, Any]:
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("Nome da categoria e obrigatorio.")

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO categories (name) VALUES (?)",
                (normalized_name,),
            )
            category_id = cursor.lastrowid
    except sqlite3.IntegrityError as exc:
        raise ValueError("Categoria ja existe.") from exc

    return {"id": category_id, "name": normalized_name}


def delete_category(category_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM categories WHERE id = ?",
            (int(category_id),),
        )
        if cursor.rowcount == 0:
            raise ValueError("Categoria nao encontrada.")


def list_offices() -> list[str]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT name FROM offices ORDER BY name ASC"
        ).fetchall()
    return [row["name"] for row in rows]


def list_employees() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, nome, escritorio FROM Funcionarios ORDER BY escritorio ASC, nome ASC"
        ).fetchall()
    return _rows_to_dicts(rows)


def get_employee(employee_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, nome, escritorio FROM Funcionarios WHERE id = ?",
            (int(employee_id),),
        ).fetchone()
    return _row_to_dict(row)


def upsert_employee(payload: dict[str, Any]) -> dict[str, Any]:
    employee_id = payload.get("id")
    nome = str(payload.get("nome", "")).strip()
    escritorio = str(payload.get("escritorio", "")).strip()

    if not nome or not escritorio:
        raise ValueError("Nome e escritorio sao obrigatorios.")

    with get_connection() as connection:
        _seed_offices(connection, [escritorio])
        if employee_id:
            cursor = connection.execute(
                "UPDATE Funcionarios SET nome = ?, escritorio = ? WHERE id = ?",
                (nome, escritorio, int(employee_id)),
            )
            if cursor.rowcount == 0:
                raise ValueError("Funcionario nao encontrado.")
            return {"id": int(employee_id), "nome": nome, "escritorio": escritorio}

        cursor = connection.execute(
            "INSERT INTO Funcionarios (nome, escritorio) VALUES (?, ?)",
            (nome, escritorio),
        )
        return {"id": cursor.lastrowid, "nome": nome, "escritorio": escritorio}


def delete_employee(employee_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM Funcionarios WHERE id = ?",
            (int(employee_id),),
        )
        if cursor.rowcount == 0:
            raise ValueError("Funcionario nao encontrado.")


def _employee_assignment_rows(employee_id: int | None = None) -> list[sqlite3.Row]:
    query = """
        SELECT
            f.id AS employeeId,
            f.nome,
            f.escritorio,
            ea.id AS assignmentId,
            ea.equipmentId,
            ea.equipmentName,
            ea.quantity,
            ea.movementType
        FROM Funcionarios f
        LEFT JOIN (
            SELECT
                MIN(id) AS id,
                employeeId,
                equipmentId,
                MAX(equipmentName) AS equipmentName,
                SUM(quantity) AS quantity,
                'Atribuicao' AS movementType
            FROM equipment_assignments
            WHERE movementType = 'Atribuicao'
            GROUP BY employeeId, equipmentId
        ) ea
            ON f.id = ea.employeeId
    """
    params: tuple[int, ...] = ()
    if employee_id is not None:
        query += " WHERE f.id = ?"
        params = (int(employee_id),)
    query += """
        ORDER BY
            f.escritorio ASC,
            f.nome ASC,
            ea.equipmentName ASC
    """

    with get_connection() as connection:
        return connection.execute(query, params).fetchall()


def _rows_to_employee_payload(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    employees_map: dict[int, dict[str, Any]] = {}
    for row in rows:
        employee_id = row["employeeId"]
        if employee_id not in employees_map:
            employees_map[employee_id] = {
                "id": employee_id,
                "nome": row["nome"],
                "escritorio": row["escritorio"],
                "items": [],
            }

        if row["equipmentName"]:
            employees_map[employee_id]["items"].append(
                {
                    "assignmentId": row["assignmentId"],
                    "equipmentId": row["equipmentId"],
                    "name": row["equipmentName"],
                    "quantity": row["quantity"],
                    "type": row["movementType"],
                }
            )

    return list(employees_map.values())


def list_employees_with_assignments() -> list[dict[str, Any]]:
    return _rows_to_employee_payload(_employee_assignment_rows())


def get_employee_details(employee_id: int) -> dict[str, Any] | None:
    employees = _rows_to_employee_payload(_employee_assignment_rows(employee_id))
    return employees[0] if employees else None


def list_equipments() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM equipments ORDER BY id DESC"
        ).fetchall()
    return _rows_to_dicts(rows)


def get_equipment(equipment_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM equipments WHERE id = ?",
            (int(equipment_id),),
        ).fetchone()
    return _row_to_dict(row)


def upsert_equipment(payload: dict[str, Any]) -> dict[str, Any]:
    equipment_id = payload.get("id")
    name = str(payload.get("name", "")).strip()
    category = str(payload.get("category", "")).strip()
    brand = str(payload.get("brand", "")).strip()
    model = str(payload.get("model", "")).strip()
    serial_number = str(payload.get("serialNumber", "")).strip()
    total_quantity = int(payload.get("totalQuantity", 0))
    available_quantity = int(payload.get("availableQuantity", 0))
    location = str(payload.get("location", "")).strip()
    entry_date = str(payload.get("entryDate", "")).strip()
    status = calculate_status(available_quantity)

    required_fields = [name, category, brand, model, serial_number, location, entry_date]
    if any(not field for field in required_fields):
        raise ValueError("Preencha todos os campos obrigatorios do equipamento.")
    if total_quantity < 0 or available_quantity < 0:
        raise ValueError("Quantidades não podem ser negativas.")
    if available_quantity > total_quantity:
        raise ValueError("Quantidade disponivel não pode ser maior que a quantidade total.")

    with get_connection() as connection:
        if equipment_id:
            cursor = connection.execute(
                """
                UPDATE equipments
                SET
                    name = ?,
                    category = ?,
                    brand = ?,
                    model = ?,
                    serialNumber = ?,
                    totalQuantity = ?,
                    availableQuantity = ?,
                    location = ?,
                    entryDate = ?,
                    status = ?
                WHERE id = ?
                """,
                (
                    name,
                    category,
                    brand,
                    model,
                    serial_number,
                    total_quantity,
                    available_quantity,
                    location,
                    entry_date,
                    status,
                    int(equipment_id),
                ),
            )
            if cursor.rowcount == 0:
                raise ValueError("Equipamento não encontrado.")
            return {"id": int(equipment_id), **payload, "status": status}

        cursor = connection.execute(
            """
            INSERT INTO equipments (
                name,
                category,
                brand,
                model,
                serialNumber,
                totalQuantity,
                availableQuantity,
                location,
                entryDate,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                category,
                brand,
                model,
                serial_number,
                total_quantity,
                available_quantity,
                location,
                entry_date,
                status,
            ),
        )
        return {
            "id": cursor.lastrowid,
            "name": name,
            "category": category,
            "brand": brand,
            "model": model,
            "serialNumber": serial_number,
            "totalQuantity": total_quantity,
            "availableQuantity": available_quantity,
            "location": location,
            "entryDate": entry_date,
            "status": status,
        }


def delete_equipment(equipment_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM equipments WHERE id = ?",
            (int(equipment_id),),
        )
        if cursor.rowcount == 0:
            raise ValueError("Equipamento não encontrado.")


def list_notebooks() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM notebooks ORDER BY id DESC"
        ).fetchall()
    return _rows_to_dicts(rows)


def get_notebook(notebook_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM notebooks WHERE id = ?",
            (int(notebook_id),),
        ).fetchone()
    return _row_to_dict(row)


def upsert_notebook(payload: dict[str, Any]) -> dict[str, Any]:
    notebook_id = payload.get("id")
    fields = {
        "brand": str(payload.get("brand", "")).strip(),
        "model": str(payload.get("model", "")).strip(),
        "serialNumber": str(payload.get("serialNumber", "")).strip(),
        "processor": str(payload.get("processor", "")).strip(),
        "gpu": str(payload.get("gpu", "")).strip(),
        "screenSize": str(payload.get("screenSize", "")).strip(),
        "ramTotal": int(payload.get("ramTotal", 0)),
        "ramSticks": int(payload.get("ramSticks", 0)),
        "storageType": str(payload.get("storageType", "")).strip(),
        "storageCapacity": str(payload.get("storageCapacity", "")).strip(),
        "condition": str(payload.get("condition", "")).strip(),
        "location": str(payload.get("location", "")).strip(),
        "status": str(payload.get("status", "")).strip(),
        "entryDate": str(payload.get("entryDate", "")).strip(),
    }

    required_fields = [
        "brand",
        "model",
        "serialNumber",
        "processor",
        "gpu",
        "screenSize",
        "storageType",
        "storageCapacity",
        "condition",
        "location",
        "status",
        "entryDate",
    ]
    missing = [field for field in required_fields if not fields[field]]
    if missing:
        raise ValueError("Preencha todos os campos obrigatorios do notebook.")
    if fields["ramTotal"] < 0 or fields["ramSticks"] < 0:
        raise ValueError("RAM total e quantidade de pentes nao podem ser negativos.")

    with get_connection() as connection:
        if notebook_id:
            cursor = connection.execute(
                """
                UPDATE notebooks
                SET
                    brand = ?,
                    model = ?,
                    serialNumber = ?,
                    processor = ?,
                    gpu = ?,
                    screenSize = ?,
                    ramTotal = ?,
                    ramSticks = ?,
                    storageType = ?,
                    storageCapacity = ?,
                    condition = ?,
                    location = ?,
                    entryDate = ?,
                    status = ?
                WHERE id = ?
                """,
                (
                    fields["brand"],
                    fields["model"],
                    fields["serialNumber"],
                    fields["processor"],
                    fields["gpu"],
                    fields["screenSize"],
                    fields["ramTotal"],
                    fields["ramSticks"],
                    fields["storageType"],
                    fields["storageCapacity"],
                    fields["condition"],
                    fields["location"],
                    fields["entryDate"],
                    fields["status"],
                    int(notebook_id),
                ),
            )
            if cursor.rowcount == 0:
                raise ValueError("Notebook não encontrado.")
            return {"id": int(notebook_id), **fields}

        cursor = connection.execute(
            """
            INSERT INTO notebooks (
                brand,
                model,
                serialNumber,
                processor,
                gpu,
                screenSize,
                ramTotal,
                ramSticks,
                storageType,
                storageCapacity,
                condition,
                location,
                status,
                entryDate
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                fields["brand"],
                fields["model"],
                fields["serialNumber"],
                fields["processor"],
                fields["gpu"],
                fields["screenSize"],
                fields["ramTotal"],
                fields["ramSticks"],
                fields["storageType"],
                fields["storageCapacity"],
                fields["condition"],
                fields["location"],
                fields["status"],
                fields["entryDate"],
            ),
        )
        return {"id": cursor.lastrowid, **fields}


def delete_notebook(notebook_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM notebooks WHERE id = ?",
            (int(notebook_id),),
        )
        if cursor.rowcount == 0:
            raise ValueError("Notebook não encontrado.")


def assign_equipment(equipment_id: int, employee_id: int, quantity: int, office: str) -> dict[str, Any]:
    equipment_id = int(equipment_id)
    employee_id = int(employee_id)
    quantity = int(quantity)
    office = office.strip()

    if equipment_id <= 0:
        raise ValueError("Equipamento invalido.")
    if employee_id <= 0:
        raise ValueError("Funcionario invalido.")
    if quantity <= 0:
        raise ValueError("Quantidade invalida.")
    if not office:
        raise ValueError("Escritório obrigatório.")

    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute("BEGIN")
            equipment = cursor.execute(
                "SELECT id, name, availableQuantity FROM equipments WHERE id = ?",
                (equipment_id,),
            ).fetchone()
            if not equipment:
                raise ValueError("Equipamento não encontrado.")

            employee = cursor.execute(
                "SELECT id, nome, escritorio FROM Funcionarios WHERE id = ?",
                (employee_id,),
            ).fetchone()
            if not employee:
                raise ValueError("Funcionario não encontrado.")
            if employee["escritorio"] != office:
                raise ValueError("O escritorio selecionado não corresponde ao funcionario informado.")

            available_quantity = int(equipment["availableQuantity"])
            if available_quantity < quantity:
                raise ValueError("Quantidade indisponivel para atribuição.")

            next_available_quantity = available_quantity - quantity
            next_status = calculate_status(next_available_quantity)
            created_at = datetime.utcnow().isoformat()

            cursor.execute(
                "UPDATE equipments SET availableQuantity = ?, status = ? WHERE id = ?",
                (next_available_quantity, next_status, equipment_id),
            )
            _log_equipment_assignment_event(
                connection,
                equipment_id=equipment["id"],
                equipment_name=equipment["name"],
                employee_id=employee["id"],
                employee_name=employee["nome"],
                office=office,
                quantity=quantity,
                movement_type="Atribuicao",
                created_at=created_at,
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise

    return {
        "equipmentId": equipment_id,
        "employeeId": employee_id,
        "quantity": quantity,
        "office": office,
    }


def unassign_all(employee_id: int) -> None:
    employee_id = int(employee_id)
    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute("BEGIN")
            rows = cursor.execute(
                """
                SELECT id, equipmentId, equipmentName, employeeName, office, quantity
                FROM equipment_assignments
                WHERE employeeId = ? AND movementType = 'Atribuicao'
                ORDER BY id ASC
                """,
                (employee_id,),
            ).fetchall()
            for row in rows:
                cursor.execute(
                    """
                    UPDATE equipments
                    SET
                        availableQuantity = availableQuantity + ?,
                        status = CASE
                            WHEN availableQuantity + ? > 0 THEN 'Em estoque'
                            ELSE status
                        END
                    WHERE id = ?
                    """,
                    (row["quantity"], row["quantity"], row["equipmentId"]),
                )
            cursor.execute(
                "DELETE FROM equipment_assignments WHERE employeeId = ? AND movementType = 'Atribuicao'",
                (employee_id,),
            )
            created_at = datetime.utcnow().isoformat()
            for row in rows:
                _log_equipment_assignment_event(
                    connection,
                    equipment_id=int(row["equipmentId"]),
                    equipment_name=str(row["equipmentName"]),
                    employee_id=employee_id,
                    employee_name=str(row["employeeName"]),
                    office=str(row["office"]),
                    quantity=int(row["quantity"]),
                    movement_type="Devolucao",
                    created_at=created_at,
                )
            connection.commit()
        except Exception:
            connection.rollback()
            raise


def unassign_item(employee_id: int, equipment_id: int, quantity: int) -> None:
    employee_id = int(employee_id)
    equipment_id = int(equipment_id)
    quantity = int(quantity)
    if quantity <= 0:
        raise ValueError("Quantidade invalida.")

    with get_connection() as connection:
        cursor = connection.cursor()
        try:
            cursor.execute("BEGIN")
            rows = cursor.execute(
                """
                SELECT id, equipmentName, employeeName, office, quantity
                FROM equipment_assignments
                WHERE employeeId = ? AND equipmentId = ? AND movementType = 'Atribuicao'
                ORDER BY id ASC
                """,
                (employee_id, equipment_id),
            ).fetchall()
            total_assigned = sum(int(row["quantity"]) for row in rows)
            if total_assigned < quantity:
                raise ValueError("Quantidade informada maior que a possuida.")

            remaining_to_unassign = quantity
            for row in rows:
                if remaining_to_unassign <= 0:
                    break
                current_quantity = int(row["quantity"])
                if current_quantity <= remaining_to_unassign:
                    remaining_to_unassign -= current_quantity
                    cursor.execute(
                        "DELETE FROM equipment_assignments WHERE id = ?",
                        (row["id"],),
                    )
                else:
                    cursor.execute(
                        "UPDATE equipment_assignments SET quantity = quantity - ? WHERE id = ?",
                        (remaining_to_unassign, row["id"]),
                    )
                    remaining_to_unassign = 0

            cursor.execute(
                "UPDATE equipments SET availableQuantity = availableQuantity + ?, status = 'Em estoque' WHERE id = ?",
                (quantity, equipment_id),
            )
            if rows:
                _log_equipment_assignment_event(
                    connection,
                    equipment_id=equipment_id,
                    equipment_name=str(rows[0]["equipmentName"]),
                    employee_id=employee_id,
                    employee_name=str(rows[0]["employeeName"]),
                    office=str(rows[0]["office"]),
                    quantity=quantity,
                    movement_type="Devolucao",
                )
            connection.commit()
        except Exception:
            connection.rollback()
            raise


def get_equipment_history(equipment_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                equipmentId,
                equipmentName,
                employeeId,
                employeeName,
                office,
                quantity,
                movementType,
                createdAt
            FROM equipment_assignments
            WHERE equipmentId = ?
            ORDER BY createdAt DESC, id DESC
            """,
            (int(equipment_id),),
        ).fetchall()
    return _rows_to_dicts(rows)


def get_dashboard_stats() -> dict[str, int]:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM equipments) AS totalItems,
                (SELECT COUNT(*) FROM equipments WHERE status = 'Em estoque') AS inStock,
                (SELECT COUNT(*) FROM equipments WHERE status = 'Em falta') AS outOfStock,
                (SELECT COUNT(*) FROM Funcionarios) AS totalEmployees,
                (SELECT COUNT(*) FROM notebooks) AS totalNotebooks,
                COALESCE((SELECT SUM(totalQuantity - availableQuantity) FROM equipments), 0) AS assignedItems
            """
        ).fetchone()

    return {
        "totalItems": int(row["totalItems"]),
        "inStock": int(row["inStock"]),
        "outOfStock": int(row["outOfStock"]),
        "totalEmployees": int(row["totalEmployees"]),
        "totalNotebooks": int(row["totalNotebooks"]),
        "assignedItems": int(row["assignedItems"]),
    }


def _fit_columns(worksheet: Any, dataframe: pd.DataFrame) -> None:
    for index, column_name in enumerate(dataframe.columns, start=1):
        column_values = [str(column_name)] + [str(value) for value in dataframe[column_name].tolist()]
        worksheet.column_dimensions[chr(64 + index)].width = min(
            max(len(value) for value in column_values) + 2,
            40,
        )


def _build_excel_bytes(dataframe: pd.DataFrame, sheet_name: str) -> bytes:
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        dataframe.to_excel(writer, sheet_name=sheet_name, index=False)
        worksheet = writer.book[sheet_name]
        for cell in worksheet[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(fill_type="solid", fgColor="0052CC")
        _fit_columns(worksheet, dataframe)
    buffer.seek(0)
    return buffer.getvalue()


def export_equipments_report() -> bytes:
    dataframe = pd.DataFrame(list_equipments())
    if dataframe.empty:
        dataframe = pd.DataFrame(
            columns=[
                "id",
                "name",
                "category",
                "brand",
                "model",
                "serialNumber",
                "totalQuantity",
                "availableQuantity",
                "status",
                "location",
                "entryDate",
            ]
        )
    dataframe = dataframe[
        [
            "id",
            "name",
            "category",
            "brand",
            "model",
            "serialNumber",
            "totalQuantity",
            "availableQuantity",
            "status",
            "location",
            "entryDate",
        ]
    ]
    dataframe.columns = [
        "ID",
        "Nome do Produto",
        "Categoria",
        "Marca",
        "Modelo",
        "Numero de Serie",
        "Qtd Total",
        "Qtd Disponivel",
        "Status",
        "Localizacao",
        "Data de Entrada",
    ]
    return _build_excel_bytes(dataframe, "Inventario de TI")


def export_notebooks_report() -> bytes:
    dataframe = pd.DataFrame(list_notebooks())
    if dataframe.empty:
        dataframe = pd.DataFrame(
            columns=[
                "id",
                "brand",
                "model",
                "serialNumber",
                "processor",
                "gpu",
                "screenSize",
                "ramTotal",
                "ramSticks",
                "storageType",
                "storageCapacity",
                "condition",
                "location",
                "status",
                "entryDate",
            ]
        )
    dataframe = dataframe[
        [
            "id",
            "brand",
            "model",
            "serialNumber",
            "processor",
            "gpu",
            "screenSize",
            "ramTotal",
            "ramSticks",
            "storageType",
            "storageCapacity",
            "condition",
            "location",
            "status",
            "entryDate",
        ]
    ]
    dataframe.columns = [
        "ID",
        "Marca",
        "Modelo",
        "Numero de Serie",
        "Processador",
        "Placa de Video",
        "Tela",
        "RAM Total (GB)",
        "Pentes RAM",
        "Armazenamento",
        "Capacidade",
        "Condicao",
        "Localizacao",
        "Status",
        "Data de Entrada",
    ]
    return _build_excel_bytes(dataframe, "Inventario de Notebooks")


def export_employees_report() -> bytes:
    dataframe = pd.DataFrame(list_employees())
    if dataframe.empty:
        dataframe = pd.DataFrame(columns=["id", "nome", "escritorio"])
    dataframe = dataframe[["id", "nome", "escritorio"]]
    dataframe.columns = ["ID", "Nome", "Escritorio"]
    return _build_excel_bytes(dataframe, "Lista de Colaboradores")


def decode_html_entities(value: str = "") -> str:
    decoded = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", str(value), flags=re.S)
    for _ in range(3):
        next_value = html.unescape(decoded)
        for entity, replacement in HTML_ENTITY_MAP.items():
            next_value = re.sub(re.escape(entity), replacement, next_value, flags=re.I)
        if next_value == decoded:
            break
        decoded = next_value
    return decoded.strip()


def strip_html(value: str = "") -> str:
    text = decode_html_entities(value)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"</?[^>]+>", " ", text, flags=re.I)
    text = re.sub(r"&lt;/?[^&]+&gt;", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\[[^\]]+\]", " ", text)
    text = re.sub(
        r"\s-\s(?:Google News|UOL|G1|Canaltech|Tecnoblog|Exame|Olhar Digital)\b.*$",
        "",
        text,
        flags=re.I,
    )
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_tag_value(source: str, tag_name: str) -> str:
    match = re.search(rf"<{tag_name}[^>]*>([\s\S]*?)</{tag_name}>", source, flags=re.I)
    return match.group(1) if match else ""


def _parse_news_date(value: str) -> datetime:
    try:
        return parsedate_to_datetime(value)
    except Exception:
        return datetime.min


def fetch_ai_news(limit: int = 3) -> list[dict[str, Any]]:
    try:
        response = requests.get(
            NEWS_FEED_URL,
            timeout=15,
            headers={"User-Agent": "inventory-python-app/1.0"},
        )
        response.raise_for_status()
        xml = response.text
        item_matches = re.findall(r"<item\b[\s\S]*?</item>", xml, flags=re.I)
        items: list[dict[str, Any]] = []
        for index, item in enumerate(item_matches):
            title = strip_html(_extract_tag_value(item, "title"))
            link = decode_html_entities(_extract_tag_value(item, "link"))
            description = strip_html(_extract_tag_value(item, "description"))
            pub_date = strip_html(_extract_tag_value(item, "pubDate"))
            if title and link:
                items.append(
                    {
                        "title": title,
                        "link": link,
                        "description": description or "Leia a cobertura completa para acompanhar a atualizacao.",
                        "pubDate": pub_date,
                        "category": "IA",
                        "image": TECH_BANNER_IMAGES[index % len(TECH_BANNER_IMAGES)],
                    }
                )
        items.sort(key=lambda item: _parse_news_date(item["pubDate"]), reverse=True)
        if items:
            return items[:limit]
    except Exception:
        pass

    today_iso = datetime.utcnow().date().isoformat()
    return [
        {
            "title": "Tendencias de IA em destaque",
            "description": "Acompanhe os principais movimentos em inteligencia artificial enquanto o feed externo e recarregado.",
            "image": TECH_BANNER_IMAGES[0],
            "link": "https://news.google.com/search?q=inteligencia%20artificial&hl=pt-BR&gl=BR&ceid=BR%3Apt-419",
            "category": "IA",
            "pubDate": today_iso,
        },
        {
            "title": "Modelos, produtos e pesquisa em IA",
            "description": "A versao Python mantem somente noticias relacionadas a IA, com foco em tecnologia e inovacao.",
            "image": TECH_BANNER_IMAGES[1],
            "link": "https://news.google.com/search?q=inteligencia%20artificial&hl=pt-BR&gl=BR&ceid=BR%3Apt-419",
            "category": "IA",
            "pubDate": today_iso,
        },
        {
            "title": "Atualizacao automatica ativada",
            "description": "As tres postagens sao renovadas automaticamente para manter a secao sempre atualizada com IA.",
            "image": TECH_BANNER_IMAGES[2],
            "link": "https://news.google.com/search?q=inteligencia%20artificial&hl=pt-BR&gl=BR&ceid=BR%3Apt-419",
            "category": "IA",
            "pubDate": today_iso,
        },
    ]


def parse_iso_date(value: str | None) -> date:
    if not value:
        return date.today()
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return date.today()
