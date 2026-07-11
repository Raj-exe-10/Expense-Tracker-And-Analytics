# Architecture

LedgerCore is a **monolith**: one Django REST API and one React SPA. There is no separate API gateway, mobile client, or WebSocket server in this repository.

## System context

```mermaid
flowchart LR
  browser[Browser_SPA]
  api[Django_DRF_API]
  db[(PostgreSQL)]
  redis[(Redis)]
  worker[Celery_Worker]
  beat[Celery_Beat]

  browser -->|"HTTPS_JSON_JWT"| api
  api --> db
  api --> redis
  worker --> db
  worker --> redis
  beat --> redis
```

| Component | Path / notes |
|-----------|----------------|
| SPA | `frontend/` — React 18, MUI, Redux, Axios |
| API | `backend/` — Django 4.2, DRF, SimpleJWT |
| DB | Postgres via `DATABASE_URL` (SQLite fallback for local) |
| Jobs | Celery + Redis — `backend/config/celery.py` |

See [feature-status.md](feature-status.md) for what is fully wired vs stubbed.

## Docker Compose

From [`docker-compose.yml`](../docker-compose.yml):

```mermaid
flowchart TB
  subgraph compose [docker_compose]
    fe[frontend_3000]
    be[backend_8000]
    celery[celery_worker]
    beat[celery_beat]
    pg[postgres_15]
    rd[redis_7]
  end

  fe --> be
  be --> pg
  be --> rd
  celery --> pg
  celery --> rd
  beat --> rd
```

Local without Docker: `python setup_dev.py` then `.\start.ps1` — see [getting-started.md](getting-started.md).

## Request path

```mermaid
sequenceDiagram
  participant UI as React_SPA
  participant AX as Axios_api_ts
  participant DRF as Django_DRF
  participant MW as APILoggingMiddleware
  participant DB as Postgres

  UI->>AX: *API call
  AX->>DRF: Bearer JWT /api/...
  DRF->>MW: process request
  MW->>DB: optional SystemLog
  DRF->>DB: queryset
  DRF-->>AX: JSON
  AX-->>UI: data or refresh on 401
```

Auth refresh details: [flows.md](flows.md).

## Backend apps → API prefixes

Registered in [`backend/config/urls.py`](../backend/config/urls.py):

```mermaid
flowchart TB
  urls[config_urls]
  urls --> auth["/api/auth/"]
  urls --> expenses["/api/expenses/"]
  urls --> groups["/api/groups/"]
  urls --> payments["/api/payments/"]
  urls --> analytics["/api/analytics/"]
  urls --> notifications["/api/notifications/"]
  urls --> core["/api/core/"]
  urls --> budget["/api/budget/"]
  urls --> dashboard["/api/dashboard/"]
  urls --> enterprise["/api/enterprise/"]
  urls --> docs["/api/docs/"]
```

| App (`backend/apps/`) | Responsibility |
|----------------------|----------------|
| `authentication` | Users, JWT, TOTP / app-lock |
| `expenses` | Expenses, shares, recurring, offline sync |
| `groups` | Groups (UI: Squads), memberships, invites |
| `payments` | Settlements, balances, payment requests |
| `budget` | Envelopes, monthly budgets, fixed costs, goals |
| `analytics` | Trends, post-game, insights |
| `notifications` | In-app notifications |
| `enterprise` | Entities, audit events, export jobs |
| `core` | Currency, categories, SystemLog, home dashboard |

## Frontend zones (summary)

```mermaid
flowchart LR
  landing["/ Landing"]
  app["/app PersonalShell"]
  search["/search SearchShell"]
  admin["/admin AdminShell"]

  landing --> app
  app --> search
  app --> admin
```

Full route map: [frontend.md](frontend.md). Glossary: [glossary.md](glossary.md).
