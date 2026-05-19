# scripts/translate_schema.py
"""Migração de esquema do banco SQLite para nomes em português.

Execução:
    python scripts/translate_schema.py

Pré‑requisitos:
- SQLite 3.25+ (suporta ALTER TABLE RENAME COLUMN)
- Backup do banco (recomendado) antes de rodar.
"""
import sqlite3
import pathlib
import sys

# Caminho do banco (relativo ao diretório raiz do projeto)
BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "inventory.db"

if not DB_PATH.exists():
    sys.exit(f"Banco não encontrado em {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Desativar foreign_keys temporariamente
cur.execute("PRAGMA foreign_keys=OFF;")
conn.commit()

# Mapas de renomeação
TABLE_RENAMES = {
    "users": "usuarios",
    "equipments": "equipamentos",
    "notebooks": "notebooks",
    "categories": "categorias",
    "Funcionarios": "funcionarios",
    "equipment_assignments": "atribuicoes_equipamentos",
    "sessions": "sessoes",
}

COLUMN_RENAMES = {
    "usuarios": {
        "username": "nome_usuario",
        "password": "senha",
    },
    "equipamentos": {
        "name": "nome",
        "category": "categoria",
        "brand": "marca",
        "model": "modelo",
        "serialNumber": "numero_serie",
        "totalQuantity": "quantidade_total",
        "availableQuantity": "quantidade_disponivel",
        "location": "localizacao",
        "entryDate": "data_entrada",
        "status": "status",
    },
    "notebooks": {
        "brand": "marca",
        "model": "modelo",
        "serialNumber": "numero_serie",
        "processor": "processador",
        "gpu": "gpu",
        "screenSize": "tamanho_tela",
        "ramTotal": "ram_total",
        "ramSticks": "ram_fitas",
        "storageType": "tipo_armazenamento",
        "storageCapacity": "capacidade_armazenamento",
        "condition": "condicao",
        "location": "localizacao",
        "status": "status",
        "entryDate": "data_entrada",
    },
    "categorias": {
        "name": "nome",
    },
    "funcionarios": {
        "nome": "nome",
        "escritorio": "escritorio",
    },
    "atribuicoes_equipamentos": {
        "equipmentId": "equipamento_id",
        "equipmentName": "nome_equipamento",
        "employeeId": "funcionario_id",
        "employeeName": "nome_funcionario",
        "office": "escritorio",
        "quantity": "quantidade",
        "movementType": "tipo_movimento",
        "createdAt": "data_criacao",
    },
    "sessoes": {
        "tokenHash": "hash_token",
        "userId": "usuario_id",
        "username": "nome_usuario",
        "createdAt": "data_criacao",
        "expiresAt": "data_expiracao",
    },
}

def rename_table(old, new):
    print(f"Renomeando tabela {old} → {new}")
    cur.execute(f"ALTER TABLE {old} RENAME TO {new};")

def rename_columns(table, mapping):
    for old, new in mapping.items():
        print(f"  Renomeando coluna {table}.{old} → {new}")
        cur.execute(f"ALTER TABLE {table} RENAME COLUMN {old} TO {new};")

# Renomear tabelas
for old, new in TABLE_RENAMES.items():
    rename_table(old, new)

# Renomear colunas
for tbl, mp in COLUMN_RENAMES.items():
    rename_columns(tbl, mp)

# Reactivar foreign_keys e finalizar
cur.execute("PRAGMA foreign_keys=ON;")
conn.commit()
conn.close()
print("Migração concluída com sucesso.")
