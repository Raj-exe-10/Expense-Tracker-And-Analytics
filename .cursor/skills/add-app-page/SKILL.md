---
name: add-app-page
description: >-
  Add a React page and route under the correct LedgerCore shell (/app, /search,
  or /admin). Use when creating screens, wiring navigation, or moving legacy
  routes.
---

# Add app page

## Steps

1. Create page under `frontend/src/pages/app|admin|search|landing/` as appropriate.
2. Lazy-load and register in `frontend/src/routes/AppRoutes.tsx` inside the correct shell.
3. Apply `AuthGuard` / `AdminGuard` / `PublicGuard` like sibling routes.
4. Add nav item only if that shell’s nav should expose it.
5. Reuse `PageShell` and `layout/constants.ts`; use zone-appropriate theme.
6. Call APIs only via `services/api.ts`.
7. If page has non-trivial logic, add focused tests (`write-tests`).
8. Run `verify-and-fix` (`npx tsc --noEmit` minimum).

See `docs/agent-kb/frontend-map.md`. For landing, also follow `.cursor/rules/landing-ui.mdc`.
For human route diagrams see `docs/frontend.md`. Glossary: `docs/glossary.md`.
