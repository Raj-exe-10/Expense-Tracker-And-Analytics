# Frontend

UI brand: **LedgerCore**. Stack: React 18, TypeScript, MUI v5, Redux Toolkit, React Router, Axios.

Source of routes: [`frontend/src/routes/AppRoutes.tsx`](../frontend/src/routes/AppRoutes.tsx).

## Three shells

```mermaid
flowchart TB
  subgraph publicZone [Public]
    land["/ LandingPage"]
    login["/login /register /forgot-password"]
    legal["/terms /privacy"]
  end

  subgraph personal [PersonalShell_/app]
    home["/app/home"]
    expenses["/app/expenses"]
    add["/app/add"]
    budget["/app/budget"]
    people["/app/people"]
    squad["/app/squads/:id"]
    analytics["/app/analytics"]
    postgame["/app/analytics/post-game"]
    settle["/app/settlements"]
    more["settings profile notifications ..."]
  end

  subgraph searchZone [SearchShell_/search]
    hub["/search"]
    ledger["/search/ledger"]
    squads["/search/squads"]
    audit["/search/audit"]
    export["/search/export"]
  end

  subgraph adminZone [AdminShell_/admin]
    adash["/admin"]
    aledger["/admin/ledger"]
    alogs["/admin/logs"]
    aent["/admin/entities"]
    moreAdmin["audit reports export alerts vault settings"]
  end
```

| Zone | Shell | Guard | Who |
|------|-------|-------|-----|
| `/app/*` | `PersonalShell` | `AuthGuard` | Signed-in users |
| `/search/*` | `SearchShell` | `AuthGuard` | Signed-in users |
| `/admin/*` | `AdminShell` | `AuthGuard` + `AdminGuard` | `admin` / `enterprise_admin` |
| `/` auth pages | — | `PublicGuard` | Guests |

Legacy paths (`/dashboard`, `/expenses`, …) redirect into `/app/*`.

**Squad** in the UI is a **Group** in the API — see [glossary.md](glossary.md).

## Auth bootstrap

```mermaid
flowchart TD
  mount[App_mount]
  boot[authBootstrap_checkAuthStatus]
  token{access_token?}
  me["GET /api/auth/me/"]
  authed[Redux_user_set]
  guest[Unauthenticated]
  route[AppRoutes_guards]

  mount --> boot
  boot --> token
  token -->|yes| me
  token -->|no| guest
  me -->|ok| authed
  me -->|fail_refresh| guest
  authed --> route
  guest --> route
```

- Tokens: `frontend/src/utils/storage.ts`
- Refresh on 401: `frontend/src/services/authSession.ts` (no full-page reload)
- Admin gate: `frontend/src/utils/roles.ts` → `canAccessAdminZone()`

## State and API client

```mermaid
flowchart LR
  pages[Pages_Components]
  slices[Redux_slices]
  api[services_api_ts]
  backend[Django_/api]

  pages --> slices
  pages --> api
  slices --> api
  api -->|"Bearer JWT"| backend
```

Named clients in `frontend/src/services/api.ts`: `authAPI`, `expensesAPI`, `groupsAPI`, `budgetAPI`, `settlementsAPI`, `analyticsAPI`, `enterpriseAPI`, `syncAPI`, `systemLogsAPI`, …

## Themes

| Surface | Tokens |
|---------|--------|
| App (dark) | `frontend/src/theme/ledgerCoreTheme.ts` |
| Landing | `frontend/src/pages/landing/landingTokens.ts` |
| Layout | `frontend/src/layout/constants.ts` |

## Layout building blocks

`PersonalShell`, `SearchShell`, `AdminShell`, `PageShell`, `AppTopBar`, `DesktopShellLayout`, `BottomNav` under `frontend/src/layout/`.
