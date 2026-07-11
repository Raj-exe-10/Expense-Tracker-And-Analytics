# Getting started

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Optional: Docker Desktop, PostgreSQL 15, Redis 7 (Compose provides these)

## Quick local setup (Windows-friendly)

From the repo root:

```powershell
python setup_dev.py
.\start.ps1
```

This creates the backend venv, installs dependencies, and starts Django (`:8000`) plus React (`:3000`).

### Manual alternative

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # if needed
python manage.py migrate
python manage.py runserver
```

```powershell
cd frontend
npm install
npm start
```

### Docker

```powershell
docker-compose up -d
```

Services: postgres, redis, backend, frontend, celery, celery-beat — see [architecture.md](architecture.md).

## First-time data

```powershell
cd backend
.\venv\Scripts\activate
python manage.py migrate
python manage.py createsuperuser
# optional test users (if command exists):
python manage.py create_test_users
```

## Verify

| Check | URL / command |
|-------|----------------|
| SPA | http://localhost:3000 |
| API health / docs | http://localhost:8000/api/docs/ |
| Django check | `python manage.py check` |
| Frontend types | `cd frontend; npx tsc --noEmit` |

## Project map

```text
backend/          Django API
frontend/         React SPA (LedgerCore)
docs/             Human docs (this folder)
docs/agent-kb/    Concise AI agent knowledge base
AGENTS.md         Agent entry point
docker-compose.yml
setup_dev.py / start.ps1
```

## Next reading

1. [glossary.md](glossary.md) — product terms  
2. [feature-status.md](feature-status.md) — what actually works  
3. [architecture.md](architecture.md) / [frontend.md](frontend.md)  
4. [api-overview.md](api-overview.md)  

Agent-oriented runbook: [`agent-kb/runbook.md`](agent-kb/runbook.md).

## Env and secrets

- Examples: `backend/.env.example`, `frontend/.env.example`
- Never commit real secrets — see root [`SECURITY.md`](../SECURITY.md)
