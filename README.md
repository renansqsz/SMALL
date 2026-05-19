<<<<<<< HEAD
# Campsoft Inventory Migration

This repository now contains two application layers:

- `backend/`: new `FastAPI` backend that reuses the existing Python business rules and SQLite database.
- `frontend/`: new `Next.js + TypeScript` frontend that replaces the Streamlit interface.
- `app.py`: legacy Streamlit app kept temporarily as a fallback while migration finishes.

## Current Architecture

### Backend

- `FastAPI`
- `Pydantic`
- Existing domain logic reused from `python_app/services.py`
- Existing SQLite database in `data/inventory.db`
- Cookie-based authentication stored in the shared SQLite database

### Frontend

- `Next.js`
- `React`
- `TypeScript`
- Custom CSS UI foundation

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Run The Backend

From the repository root:

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:

```bash
http://127.0.0.1:8000/health
```

Main API prefix:

```text
http://127.0.0.1:8000/api/v1
```

## Run The Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `.env.local` from `.env.local.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Then start the frontend:

```bash
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:3000
```

## Legacy Login

- User: `admin`
- Password: `admin`

## Migrated Pages

- `/login`
- `/dashboard`
- `/equipments`
- `/notebooks`
- `/categories`
- `/employees`

## Notes

- External news loading was intentionally left out of the new dashboard to avoid reintroducing slow blocking requests.
- The Streamlit app is still present, but it is no longer the recommended entry point.
- The migration prioritizes replacing the UI runtime first and preserving the current business rules.
=======
# SMALL
>>>>>>> eec62ebe96db64388ca3de44a6d9321bb1cac75a
