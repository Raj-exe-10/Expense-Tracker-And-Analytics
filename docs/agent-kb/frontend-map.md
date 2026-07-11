# Frontend map

## Entry

- `frontend/src/index.tsx` — Redux Provider, AppProvider
- `frontend/src/App.tsx` — auth bootstrap, theme (dark app vs light auth/admin), session-expired handler
- Routes: `frontend/src/routes/AppRoutes.tsx`

## Shells (`frontend/src/layout/`)

- `PersonalShell` — `/app/*` (bottom nav + desktop sidebar)
- `SearchShell` — `/search/*`
- `AdminShell` — `/admin/*`
- Shared: `PageShell`, `AppTopBar`, `DesktopShellLayout`, constants in `layout/constants.ts`

## Key `/app` routes

home, expenses, add, budget, people, squads/:id, analytics, analytics/post-game, settlements, settings, profile, notifications, recurring, more, groups/join/:inviteCode

Legacy paths (`/dashboard`, `/expenses`, …) redirect into `/app/*`.

## State

Redux slices under `frontend/src/store/slices/`: auth, expense, group, analytics, postGameAnalytics, core. Typed hooks: `frontend/src/hooks/redux.ts`.

## API client

All HTTP via named modules in `frontend/src/services/api.ts` (`authAPI`, `expensesAPI`, …). Components should not invent raw axios URLs.

## Themes

- App dark: `frontend/src/theme/ledgerCoreTheme.ts`
- Landing: `frontend/src/pages/landing/landingTokens.ts` (+ Desktop/Mobile landing sections)
- Layout tokens: `frontend/src/layout/constants.ts`
- Primitives: `frontend/src/components/lc/` (e.g. `LcCard`)

## Adding a page

1. Page under `pages/app|admin|search|landing/` as appropriate.
2. Lazy route in `AppRoutes.tsx` inside the correct shell + guard.
3. Nav entry only if the shell’s nav lists that destination.
4. Reuse `PageShell` / layout constants; then [write-tests](testing.md) + [verification](verification.md).
