# Implementation Plan: Production UI Polish + Animations

**Branch**: `001-production-ui-polish` | **Date**: 2026-07-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-production-ui-polish/spec.md`

## Summary

Introduce a small set of shared presentation primitives (loading, empty, error states; a page-entrance animation wrapper; an accessible focus/skip pattern) under `frontend/src/components/lc/`, then adopt them across representative pages in all three shells (PersonalShell, SearchShell, AdminShell) without touching route paths, guards, redirects, or data-fetching logic. Add `framer-motion` for entrance/transition animation on pages touched by this initiative, respecting `prefers-reduced-motion` via framer-motion's built-in `useReducedMotion` hook (no extra dependency needed for that). All visuals derive from the existing `ledgerCoreTheme.ts` palette/typography and `layout/constants.ts` spacing tokens — no new theme or design-token system.

## Technical Context

**Language/Version**: TypeScript 4.9, React 18

**Primary Dependencies**: MUI v5 (`@mui/material`, `@mui/icons-material`), Redux Toolkit, React Router v7, `framer-motion` (new)

**Storage**: N/A (presentation layer only; consumes existing Redux slices / `*API` modules unchanged)

**Testing**: Jest + React Testing Library (`frontend`, via `react-scripts test`)

**Target Platform**: Web (desktop + mobile browsers), existing `browserslist` config in `frontend/package.json`

**Project Type**: Web application (existing `backend/` + `frontend/` monorepo) — this feature touches `frontend/` only

**Performance Goals**: Entrance animation starts within 300ms of navigation and completes within 500ms (SC-005); no added jank (animations run on transform/opacity only, GPU-friendly)

**Constraints**: No changes to route paths/guards/redirects (`AppRoutes.tsx`, `guards.tsx`); no new design-token system — reuse `theme/ledgerCoreTheme.ts` and `layout/constants.ts`; WCAG 2.1 AA contrast; keyboard operability; `prefers-reduced-motion` respected

**Scale/Scope**: 3 shells, ~30+ existing pages; this pass ships shared primitives plus a prioritized subset of pages per shell (see Structure Decision); remaining pages keep working unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First, Then Minimal Diff | Full Spec Kit path used (this is a cross-cutting, non-trivial product change). New dependency (`framer-motion`) is an explicit user decision, not an unrequested addition. | PASS |
| II. Graphify Before Explore | `graphify query` used to locate shells/theme/layout/state patterns before Read/Grep. | PASS |
| III. No Invented APIs | No API/route changes; existing `*API` modules and Redux slices are consumed as-is. | PASS |
| IV. Permissions and Trust Boundaries | No permission/queryset changes (frontend-only, presentation layer). | PASS (N/A) |
| V. Tests and Verify Before Done | New shared components (`LcLoadingState`, `LcEmptyState`, `LcErrorState`, `PageTransition`) get focused Jest/RTL tests; `verify-and-fix` runs after implementation. | PASS |
| VI. Product Shape: Shells, Squads, Brand | All three shells kept intact; no shell routing/guard bypass; brand/terminology unchanged. | PASS |
| VII. Secrets and Safety | No secrets/env/auth changes. | PASS (N/A) |

No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-production-ui-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output (N/A — no new data entities)
├── quickstart.md         # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (speckit-tasks)
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   └── lc/
│       ├── LcCard.tsx                # existing
│       ├── LcLoadingState.tsx        # new — shared loading skeleton/spinner
│       ├── LcEmptyState.tsx          # new — shared empty-state illustration/copy/CTA slot
│       ├── LcErrorState.tsx          # new — shared error message + retry action
│       └── PageTransition.tsx        # new — framer-motion entrance wrapper, respects reduced motion
├── layout/
│   ├── PageShell.tsx                 # unchanged API; pages adopt new state components inside it
│   └── constants.ts                  # unchanged; source of spacing tokens
├── theme/
│   └── ledgerCoreTheme.ts            # unchanged; source of color/typography tokens (contrast audit only, no token redesign)
├── pages/
│   ├── app/...                       # PersonalShell pages — polish pass + PageTransition
│   ├── search/...                    # SearchShell pages — polish pass + PageTransition
│   └── admin/...                     # AdminShell pages — polish pass + PageTransition
└── routes/
    └── AppRoutes.tsx                 # unchanged (no route/guard edits)

frontend/src/components/lc/__tests__/  # new — Jest/RTL tests for the 4 new primitives
```

**Structure Decision**: Reuse the existing `frontend/src/components/lc/` primitives folder (already holds `LcCard`) for the new shared state/animation components, and the existing `layout/` + `theme/` sources for tokens. No new top-level directories. Backend (`backend/`) is untouched.

## Complexity Tracking

*No constitution violations — table not needed.*
