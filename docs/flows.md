# Key flows

Sequence diagrams for the behaviors that are easy to misunderstand. Code paths are linked under each diagram.

## 1. JWT login and refresh

```mermaid
sequenceDiagram
  participant UI as React
  participant Store as localStorage
  participant API as Django_auth
  participant Res as Protected_API

  UI->>API: POST /api/auth/login/ or token/
  API-->>UI: access + refresh
  UI->>Store: save tokens
  UI->>Res: GET with Authorization Bearer access
  Res-->>UI: 200 data

  Note over UI,Res: Later access expired
  UI->>Res: request with stale access
  Res-->>UI: 401
  UI->>API: POST /api/auth/token/refresh/
  API-->>UI: new access
  UI->>Store: update access
  UI->>Res: retry original request
  Res-->>UI: 200 data
```

Implementation: `frontend/src/services/authSession.ts`, `frontend/src/services/api.ts` interceptors, `backend/apps/authentication/`.

If refresh fails → session expired handler clears tokens (no blind full reload loop).

## 2. Offline expense sync and conflicts

```mermaid
sequenceDiagram
  participant Offline as offlineService
  participant Sync as POST_expenses_sync
  participant DB as Expense_row

  Offline->>Sync: items id base_version data
  Sync->>DB: load expense
  alt base_version matches server version
    Sync->>DB: apply patch version plus 1
    Sync-->>Offline: applied id
  else version mismatch
    Sync-->>Offline: conflict local server versions
    Note over Offline: SyncConflictHost user chooses
    Offline->>Sync: resolution local or server
    Sync->>DB: apply or keep bump version
  end
```

- Backend: `backend/apps/expenses/sync_views.py`
- Frontend: `frontend/src/services/offlineService.ts`, `SyncConflictHost.tsx`
- Field: `Expense.version`

## 3. Settlements and balances (high level)

```mermaid
flowchart TD
  expenses[Group_or_friend_expenses]
  shares[ExpenseShares]
  balances[Net_balances_API]
  simplify[debt_simplifier]
  settle[Create_Settlement]
  done[status_completed]

  expenses --> shares
  shares --> balances
  balances --> simplify
  simplify --> settle
  settle --> done
```

- Models: `payments.Settlement`, related payment/request models
- Logic: `backend/apps/payments/debt_simplifier.py`
- UI: `/app/settlements`

Gateway charge flows (Stripe/PayPal SDK) are **not** fully live — see [feature-status.md](feature-status.md).

## 4. Request logging → SystemLog → admin UI

```mermaid
sequenceDiagram
  participant Client
  participant MW as APILoggingMiddleware
  participant Log as SystemLog
  participant Admin as AdminSystemLogsPage

  Client->>MW: any /api request
  MW->>Log: write level category path user meta
  Admin->>Log: GET via systemLogsAPI
  Log-->>Admin: filtered log rows
```

- Middleware: `backend/apps/core/middleware.py`
- Model: `core.SystemLog`
- UI: `/admin/logs` → `AdminSystemLogsPage.tsx`

`ActivityLog` is a separate domain activity model — not the same as SystemLog ([glossary.md](glossary.md)).
