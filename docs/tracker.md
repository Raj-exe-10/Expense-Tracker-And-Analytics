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

## 2026-07-19

- **[fix]** Landing page full-width fluid layout (removed 1200px content cap)
  - Note: On wide desktop displays (>1200px), the landing nav, hero/sections, stats row, and footer were centered within a hard `landing.maxContent: 1200` cap, leaving large empty side margins even though the black background filled the full window. Removed the `maxContent` token from `landingTokens.ts` and the four `maxWidth: landing.maxContent, mx: 'auto'` usages (`LandingNav` Toolbar, `DesktopLanding`'s `SectionShell` + stats-row `Grid`, `LandingFooter`'s inner `Box`), replacing them with `width: '100%'` so content now stretches to fill the viewport; added an `xl` padding step (`px: {..., xl: 6}`) on all four so content still keeps breathing room from the screen edge on ultra-wide monitors instead of a fixed-width gutter. `MobileLanding` untouched (never referenced the cap). Deliberate deviation from `.cursor/rules/landing-ui.mdc`'s original-mockup 1200px cap, per explicit user request (fully fluid, no cap) to fix the wide-screen margin issue. `npx tsc --noEmit` clean for these files (only the 5 pre-existing `expenseSlice.test.ts` errors remain); no linter errors.
  - Areas: `frontend/src/pages/landing/landingTokens.ts`, `frontend/src/pages/landing/components/LandingNav.tsx`, `frontend/src/pages/landing/sections/DesktopLanding.tsx`, `frontend/src/pages/landing/components/LandingFooter.tsx`
  - Commit: uncommitted

- **[feature]** Landing page dynamic widgets + `speckit-converge` (Spec Kit `001-production-ui-polish`, out-of-scope enhancement)
  - Note: Extended the `framer-motion` motion language from `001-production-ui-polish` to the public landing page (`frontend/src/pages/landing/`, not one of the three named shells, so tracked as an out-of-scope-but-intentional enhancement — see appended convergence task T029). `HeroDashboardPreview` now shows a brief pulsing skeleton before revealing the cash-flow widget with a fade-in, matching the terminal/analyst brand voice. `CashFlowSankey` paths/category cards grow/fade in staggered on mount. `DesktopLanding` hero copy, stats row, terminal log lines, and "Active Sessions" list now stagger-reveal with a pulsing online-status dot; hero `Grid` gained an `md` breakpoint so it stops full-width-stacking on tablet/small-laptop widths. `MobileLanding` hero + product cards gained matching entrance animations, and the empty "Illustration here" placeholder in `FeatureBlock` was replaced with a real animated bar-trend widget; `CashFlowSankey`'s `xs` column widths were tightened for extra breathing room on narrow phones. All motion respects `useReducedMotion`. Ran `speckit-converge` for `001-production-ui-polish`: 1 partial finding (manual quickstart.md browser QA still pending — no dev server in this session) and 1 unrequested finding (this landing-page work) appended as `Phase 7: Convergence` tasks T028/T029 in `specs/001-production-ui-polish/tasks.md`. `npx tsc --noEmit` clean for these files (only the 5 pre-existing `expenseSlice.test.ts` errors remain); `npm test -- --watchAll=false` unchanged (4 `lc` suites pass, the 2 pre-existing CRA/Jest ESM failures remain, no regressions).
  - Areas: `frontend/src/pages/landing/`, `specs/001-production-ui-polish/tasks.md`
  - Commit: uncommitted

- **[feature]** Production UI polish + animations (Spec Kit `001-production-ui-polish`)
  - Note: Full Spec Kit pass (specify → clarify → plan → checklist → tasks → analyze → implement). Added shared presentation primitives `LcLoadingState`/`LcEmptyState`/`LcErrorState`/`PageTransition` under `frontend/src/components/lc/` (Jest/RTL tests included) and added `framer-motion` as a new frontend dependency for entrance animation, respecting `prefers-reduced-motion` via its built-in `useReducedMotion`. Adopted the new primitives across one pilot page per shell — `HomePage`, `Expenses`, `SearchHubPage`, `AdminDashboard` — replacing ad hoc spinners/blank states with consistent loading/empty/error states and wrapping each in `PageTransition`. Audited (no code changes needed) icon-button `aria-label`s, `ExpenseForm` keyboard operability, MUI Dialog/Menu Escape/focus-return behavior, and WCAG contrast ratios for all three `ledgerCoreTheme.ts` palettes (all pairs ≥4.5:1) — all already compliant. No route, guard, or redirect logic in `AppRoutes.tsx`/`guards.tsx` was touched. `npx tsc --noEmit` and the new `lc` component test suite (9 tests) pass; pre-existing failures in `App.test.tsx` and `expenseSlice.test.ts` were verified via `git stash` to predate this work (react-router-dom v7 ESM resolution + un-transformed axios ESM under CRA's Jest config) and are unrelated/out of scope.
  - Areas: `specs/001-production-ui-polish/`, `frontend/src/components/lc/`, `frontend/src/pages/app/HomePage.tsx`, `frontend/src/pages/Expenses.tsx`, `frontend/src/pages/search/SearchHubPage.tsx`, `frontend/src/pages/admin/AdminDashboard.tsx`, `frontend/package.json`
  - Commit: uncommitted

- **[agent]** Cursor ↔ OpenCode Spec Kit + graphify + Superpowers parity
  - Note: Filled LedgerCore constitution; added graphify/agent-kb preflight to all speckit skills; mirrored 10 `speckit-*` skills into `.cursor/skills/`; added `feature-workflow` router (both agents) and `.cursor/rules/sdd-workflow.mdc`; documented Superpowers install (OpenCode plugin + Cursor marketplace) in AGENTS.md / README / agent-kb.
  - Areas: `.specify/memory/constitution.md`, `.opencode/skills/`, `.cursor/skills/`, `.cursor/rules/sdd-workflow.mdc`, `AGENTS.md`, `README.md`, `docs/agent-kb/README.md`
  - Commit: uncommitted

## 2026-07-18

- **[agent]** Integrated speckit + superpowers with existing graphify
  - Note: Installed specify CLI (v0.13.0), created `.specify/` structure with templates/scripts/memory, created 10 speckit skills in `.opencode/skills/speckit-*/` (constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge, taskstoissues), added superpowers plugin to `.opencode/opencode.json`
  - Areas: `.specify/`, `.opencode/skills/speckit-*/`, `.opencode/opencode.json`
  - Commit: uncommitted

## 2026-07-11

- **[agent]** Ponytail lazy-senior always-on rule
  - Note: Added project-only Cursor rule for YAGNI/reuse-first / minimal diffs; tests defer to write-tests + verify-and-fix (not assert demos).
  - Areas: `.cursor/rules/ponytail.mdc`
  - Commit: uncommitted

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
