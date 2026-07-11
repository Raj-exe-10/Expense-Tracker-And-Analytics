# Project tracker

Date-wise log of **developments and modifications** in LedgerCore / Expense Tracker.  
Agents append an entry when meaningful work lands. Newest dates first.

**How to add an entry**

```markdown
- **[feature|fix|docs|agent|chore]** Short title
  - Note: what changed and why (1–2 lines)
  - Areas: key paths
  - Commit: `abc1234` | uncommitted
```

Skip pure Q&A or tiny typos with no real change.

---

## 2026-07-11

- **[agent]** Skills + agent-kb updated after audit remediation
  - Note: Captured sync IDOR/OCC, privilege-field, settlement FIFO, JWT blacklist, CORS, and offline-queue invariants in skills and agent-kb so agents do not reintroduce fixed vulns.
  - Areas: `.cursor/skills/{offline-sync,add-api-endpoint,expense-tracker-dev}/`, `docs/agent-kb/{known-pitfalls,permissions,do-not,offline-sync,auth-and-roles,settlements}.md`
  - Commit: uncommitted

- **[fix]** Comprehensive audit remediation (security, sync, settlements, a11y)
  - Note: Locked UserViewSet (no privilege escalation); scoped expense sync IDOR + OCC version; staff-gated process_all; settlement share scoping + atomic payment approve; JWT blacklist; CORS/docs/Sentry hardening; offline sync mutex; a11y landmarks/labels; Squad terminology.
  - Areas: `backend/apps/authentication/`, `expenses/sync_views.py`, `payments/`, `config/settings.py`, `frontend/src/services/offlineService.ts`, shells, auth forms
  - Commit: uncommitted

- **[fix]** Classic Analytics ChunkLoadError recovery
  - Note: Added per-route `lazyWithRetry` (one reload on stale webpack chunks) for all SPA lazy routes; switched Analytics MUI icons to path imports to shrink the failing icons vendor chunk.
  - Areas: `frontend/src/utils/lazyWithRetry.ts`, `frontend/src/routes/AppRoutes.tsx`, `frontend/src/pages/Analytics.tsx`
  - Commit: uncommitted

- **[docs]** Living project tracker
  - Note: Added `docs/tracker.md` to record each development date-wise; wired agents to append on meaningful changes.
  - Areas: `docs/tracker.md`, `docs/README.md`, `AGENTS.md`, `.cursor/skills/expense-tracker-dev/`, `.cursor/rules/`
  - Commit: uncommitted

- **[agent]** Sync agent-kb and skill pointers after docs refresh
  - Note: Fixed stale links to archived megadocs; pointed skills/AGENTS/rules at `docs/README.md`, `feature-status.md`, `glossary.md`, `docs/archive/`.
  - Areas: `docs/agent-kb/`, `.cursor/skills/`, `AGENTS.md`, `.cursor/rules/project-overview.mdc`
  - Commit: uncommitted

- **[docs]** Human docs refresh (diagram-heavy)
  - Note: Archived outdated guides/audits; added architecture, frontend, data-model, flows, api-overview, getting-started, feature-status, glossary with Mermaid diagrams.
  - Areas: `docs/*.md`, `docs/archive/`
  - Commit: uncommitted

- **[agent]** Agent knowledge pack, skills, verify loop
  - Note: Added `AGENTS.md`, `docs/agent-kb/`, Cursor rules/skills (`verify-and-fix`, `write-tests`, etc.), optional stop hook for verification.
  - Areas: `AGENTS.md`, `docs/agent-kb/`, `.cursor/`
  - Commit: uncommitted

- **[docs]** Add agent documentation and logging enhancements
  - Note: Committed baseline for agent docs / logging work on branch.
  - Areas: (see commit `d7683d4`)
  - Commit: `d7683d4`

## 2026-05-24

- **[feature]** UI enhancements and post-game analytics
  - Note: Post-game analytics feature and related UI improvements.
  - Areas: analytics / frontend post-game
  - Commit: `d03ec12`

## 2026-03-03

- **[fix]** Production-grade bug fixes and updates
  - Note: Broader production readiness fixes across the project.
  - Areas: multiple
  - Commit: `fbc753d`

## 2026-02-04

- **[fix]** Auth security and exception handling
  - Note: Hardened authentication and exception handling.
  - Areas: authentication / core exceptions
  - Commit: `41c9a9f`

- **[docs]** Documentation updates
  - Note: Project documentation refresh (two commits).
  - Areas: `docs/`
  - Commit: `8288a4e`, `0d76cff`

- **[feature]** Budget page and custom categories
  - Note: Budget UI plus custom category creation/selection.
  - Areas: budget / frontend Budget
  - Commit: `75936b7`

- **[fix]** Bug fixes
  - Note: General bug fixes.
  - Areas: multiple
  - Commit: `a2ce8ba`

## 2026-02-01

- **[feature]** Expenses page updates
  - Note: Expenses page improvements.
  - Areas: expenses frontend
  - Commit: `c13d491`

- **[fix]** Analytics, expenses, notifications
  - Note: Analytics updates; expense and notification bug fixes.
  - Areas: analytics, expenses, notifications
  - Commit: `1406b15`

- **[feature]** Updated analytics and expense update fix
  - Note: Analytics code update; fix for updating expenses.
  - Areas: analytics, expenses
  - Commit: `243c5b6`

- **[feature]** Dashboard, expenses, and groups pages
  - Note: Updated dashboard, expenses, and groups UI.
  - Areas: dashboard, expenses, groups
  - Commit: `4626b5d`

## 2026-01-26

- **[fix]** Expense Tracker bug updates
  - Note: Assorted bug fixes.
  - Areas: multiple
  - Commit: `ab78b8f`

## 2025-09-08

- **[docs]** Documentation update
  - Note: Docs maintenance.
  - Areas: `docs/`
  - Commit: `7cae5c2`

## 2025-09-07

## 2026-07-11

- **[fix]** Frontend audit remediation — P1/P2/P3 (20 items)
  - Note: P1 — offline sync mutex, removed re-POST + token from IDB saves, fixed relative URLs, partial-failure notification; api.ts 401 interceptor now only retries safe GET/HEAD/OPTIONS; `.env.production` with GENERATE_SOURCEMAP=false. P2 — expenseSlice requestId guard for stale fulfillments; analyticsSlice rejected cases for category/trends + error surfaced in Analytics.tsx; AuthGuard loading state when user null; LoginForm honors ?redirect= / state.from + Apple icon fix + autoComplete + Sign In text visible during load; HomePage actingOn mutex for Approve/Dispute; Settlements submitting state for all dialog buttons; ExpenseDetail unwrap()+error alert; SyncConflictHost try/catch+disable. P3 — mobile shells wrapped in `<Box component="main" id="main-content">`; skip-to-main link in App.tsx; ExpenseList TableRow tabIndex/role/aria-label/onKeyDown; AdminShell mobile wrapped in ThemeProvider; PersonalShell sidebar label "Post-game review"; Groups heading "Squads"; Expenses+Settlements Tab ids; RegisterForm+ForgotPasswordForm autoComplete.
  - Areas: `frontend/src/services/offlineService.ts`, `frontend/src/services/api.ts`, `frontend/.env.production`, `frontend/src/store/slices/expenseSlice.ts`, `frontend/src/store/slices/analyticsSlice.ts`, `frontend/src/pages/Analytics.tsx`, `frontend/src/routes/guards.tsx`, `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/pages/app/HomePage.tsx`, `frontend/src/pages/Settlements.tsx`, `frontend/src/pages/ExpenseDetail.tsx`, `frontend/src/components/sync/SyncConflictHost.tsx`, `frontend/src/layout/PersonalShell.tsx`, `frontend/src/layout/AdminShell.tsx`, `frontend/src/layout/SearchShell.tsx`, `frontend/src/App.tsx`, `frontend/src/components/expenses/ExpenseList.tsx`, `frontend/src/pages/Groups.tsx`, `frontend/src/pages/Expenses.tsx`, `frontend/src/components/auth/RegisterForm.tsx`, `frontend/src/components/auth/ForgotPasswordForm.tsx`
  - Commit: uncommitted

- **[docs]** Initial project documentation
  - Note: Added documentation to the project.
  - Areas: `docs/`
  - Commit: `5efd249`

- **[chore]** Initial commit
  - Note: Expense Tracker app scaffold with secured credentials handling.
  - Areas: monorepo root
  - Commit: `895acaf`
