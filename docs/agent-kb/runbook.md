# Runbook (local)

## First-time setup

```bash
python setup_dev.py
```

Creates venv, installs deps, prepares env examples. Then:

```powershell
.\start.ps1
```

Or manually:

```bash
# Backend
cd backend
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (other terminal)
cd frontend
npm install
npm start
```

Docker: `docker-compose up -d` from repo root.

## Useful commands

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py create_test_users   # if management command present
python manage.py check
pytest apps/<app> -q
```

## Env

- Copy from `backend/.env.example` and `frontend/.env.example`.
- Frontend API: `REACT_APP_API_URL` (default `http://localhost:8000`).
- Never commit real secrets; see `SECURITY.md`.

## URLs

- App: `http://localhost:3000`
- API docs: `http://localhost:8000/api/docs/`
