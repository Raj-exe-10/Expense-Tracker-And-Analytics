# API overview

## Live reference (source of truth)

| Tool | URL |
|------|-----|
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| OpenAPI schema | http://localhost:8000/api/schema/ |

Hand-written endpoint catalogs in `docs/archive/` are obsolete. Capability honesty: [feature-status.md](feature-status.md).

## Base URL

- Local: `http://localhost:8000`
- Frontend env: `REACT_APP_API_URL` (Axios base + `/api` in `frontend/src/services/api.ts`)

There is **no** API version header and **no** WebSocket API in this repo.

## Prefix map

| Prefix | App | Frontend client |
|--------|-----|-----------------|
| `/api/auth/` | authentication | `authAPI`, `securityAPI` |
| `/api/expenses/` | expenses (+ sync) | `expensesAPI`, `syncAPI` |
| `/api/groups/` | groups | `groupsAPI` |
| `/api/payments/` | payments | `settlementsAPI`, … |
| `/api/analytics/` | analytics | `analyticsAPI` |
| `/api/notifications/` | notifications | `notificationsAPI` |
| `/api/core/` | core | `coreAPI`, `systemLogsAPI` |
| `/api/budget/` | budget | `budgetAPI`, `fixedCostsAPI` |
| `/api/dashboard/` | core dashboard | `dashboardAPI` |
| `/api/enterprise/` | enterprise | `enterpriseAPI` |

## Auth

- JWT access + refresh (SimpleJWT).
- Typical login/register/me under `/api/auth/`.
- Security extras: `/api/auth/security/*` (TOTP, app-lock PIN).

Sequence: [flows.md](flows.md).

## Response shape

DRF returns serializer JSON directly (lists may be paginated).

Errors commonly look like:

```json
{ "detail": "…" }
```

or field validation maps — **not** a global `{ "status": "success", "data": … }` envelope.

Default list pagination: page size **20** (`backend/config/settings.py`).

## Client convention

All SPA calls go through named helpers in [`frontend/src/services/api.ts`](../frontend/src/services/api.ts). Do not invent parallel URL strings in components.

## Curated non-CRUD flows

Documented as diagrams in [flows.md](flows.md):

1. JWT refresh
2. Offline expense sync / conflicts
3. Settlements / balances
4. SystemLog pipeline
