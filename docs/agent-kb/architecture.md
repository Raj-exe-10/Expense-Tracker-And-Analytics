# Architecture

Product UI brand: **LedgerCore**. Repo: Django REST backend + React SPA monorepo.

## Stack

| Layer | Tech |
|-------|------|
| API | Django 4.2, DRF, SimpleJWT, drf-spectacular |
| DB | PostgreSQL (`DATABASE_URL`); SQLite fallback for local |
| Jobs | Celery + Redis |
| Web | React 18, TypeScript, MUI v5, Redux Toolkit, Axios, Recharts |
| Infra | `docker-compose.yml` (postgres, redis, backend, frontend, celery) |

## Backend apps (`backend/apps/`)

| App | Responsibility |
|-----|----------------|
| `authentication` | User, JWT, security (TOTP, PIN) |
| `expenses` | Expenses, shares, recurring, offline sync |
| `groups` | Groups (UI: “Squads”), memberships, invites |
| `payments` | Settlements, balances, payment requests |
| `budget` | MonthlyBudget, wallets/envelopes, fixed costs, savings |
| `analytics` | Trends, post-game, insights, ML helpers |
| `notifications` | In-app notifications |
| `enterprise` | Entities, audit, export jobs |
| `core` | Currency, Category, Tag, SystemLog, home dashboard |

Config: `backend/config/settings.py`, root URLs: `backend/config/urls.py`.

## Frontend zones

| Zone | Shell | Base path |
|------|-------|-----------|
| Personal | `PersonalShell` | `/app/*` |
| Search | `SearchShell` | `/search/*` |
| Admin | `AdminShell` + `AdminGuard` | `/admin/*` |
| Public | — | `/`, `/login`, `/register`, … |

Routes: `frontend/src/routes/AppRoutes.tsx`. Guards: `frontend/src/routes/guards.tsx`.

## Request flow

```text
React (*API in services/api.ts)
  → Axios + Bearer JWT (authSession refresh on 401)
  → /api/... DRF viewsets / function views
  → Postgres (+ Celery/Redis for async)
```

API logging: `apps.core.middleware.APILoggingMiddleware` → `SystemLog`.

## Base model patterns

- `TimeStampedModel` — `created_at` / `updated_at`
- `UUIDModel` — UUID PKs for most domain entities
- Explicit `db_table` on many models
