# Research: Production UI Polish + Animations

## Decision: Animation library

- **Decision**: Use `framer-motion` for page entrance transitions and micro-interactions.
- **Rationale**: Explicit user choice (see spec Assumptions). Provides a declarative `motion.div` API, exit animations via `AnimatePresence`, and a built-in `useReducedMotion()` hook that reads `prefers-reduced-motion` without extra code — directly satisfies FR-009.
- **Alternatives considered**: MUI's built-in `Fade`/`Grow`/`Slide`/`Collapse` (zero new dependency, but limited to simple enter/exit transitions and no shared spring/stagger primitives); CSS-only transitions (more boilerplate per page, harder to keep consistent). Rejected because the user explicitly asked for `framer-motion`.

## Decision: Shared state components location

- **Decision**: Add `LcLoadingState`, `LcEmptyState`, `LcErrorState` to `frontend/src/components/lc/`, alongside the existing `LcCard`.
- **Rationale**: `frontend/src/components/lc/` is already the established location for shared "LedgerCore" presentation primitives; no new folder needed (FR-002).
- **Alternatives considered**: Per-shell duplicated state components — rejected, directly contradicts FR-002 (shared components over parallel patterns).

## Decision: Animation wrapper location and API

- **Decision**: Add `PageTransition` (a thin `motion.div` wrapper with a fade+slight-slide preset, ~250-350ms) to `frontend/src/components/lc/`. Pages opt in by wrapping their `PageContainer` content; `AppRoutes.tsx` and its `Suspense`/`Loading` fallback are untouched.
- **Rationale**: Keeps route/guard code in `AppRoutes.tsx` completely unmodified (FR-003), and makes adoption per-page opt-in so pages outside this pass are unaffected (FR-010).
- **Alternatives considered**: Wrapping `<Routes>` globally with `AnimatePresence` — rejected: touches `AppRoutes.tsx`, is a much larger blast radius, and risks interfering with `Suspense`/lazy route loading and guard redirects.

## Decision: Reduced motion handling

- **Decision**: `PageTransition` calls `useReducedMotion()` from `framer-motion` internally; when true, it renders children with no transform/opacity animation (instant mount).
- **Rationale**: Centralizes the reduced-motion rule in one place (FR-009) instead of per-page checks.
- **Alternatives considered**: Per-page `prefers-reduced-motion` media query checks — rejected as duplicated logic across every polished page.

## Decision: Accessibility approach

- **Decision**: Use MUI's native accessibility props (`aria-label`, `role`, focus-visible styles already partially provided by MUI defaults) plus a contrast audit of `ledgerCoreTheme.ts` palettes; add `aria-label`s to icon-only buttons/nav items found missing one during the page-by-page pass; ensure dialogs/menus (MUI `Dialog`/`Menu`) keep their default Escape-to-close/focus-return behavior rather than being overridden.
- **Rationale**: MUI v5 components already implement most of WAI-ARIA patterns (dialogs, menus) correctly by default; the main gaps are missing `aria-label`s on custom icon buttons and unverified contrast ratios, not a need for a new accessibility library.
- **Alternatives considered**: Adding `eslint-plugin-jsx-a11y` or an automated axe-core test harness — worth flagging as a nice-to-have follow-up, but not required to satisfy FR-004–FR-006 for this pass; kept out of scope to respect the "no new dependency unless justified" default beyond the one explicit `framer-motion` addition.

## Decision: Scope of pages touched in this pass

- **Decision**: Ship the shared primitives first, then apply them to a prioritized subset of high-traffic pages per shell (e.g. `HomePage`, `Expenses`, `AddExpensePage` in PersonalShell; `SearchHubPage` in SearchShell; `AdminDashboard` in AdminShell), rather than a big-bang rewrite of all ~30+ pages in one change.
- **Rationale**: Matches spec Assumptions ("pages not yet touched keep working exactly as they do today") and keeps the diff reviewable; `speckit-tasks` will enumerate the exact page list.
- **Alternatives considered**: All pages at once — rejected as high-risk, hard-to-review, and unnecessary since the spec explicitly allows incremental adoption.

All `NEEDS CLARIFICATION` markers from Technical Context are resolved above; none remain.
