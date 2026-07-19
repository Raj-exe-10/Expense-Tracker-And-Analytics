# Tasks: Production UI Polish + Animations

**Input**: Design documents from `/specs/001-production-ui-polish/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Included — new shared components are new frontend behavior (project policy: `write-tests` skill applies to new/changed behavior).

**Organization**: Tasks are grouped by user story (US1 = states/consistency, US2 = accessibility, US3 = responsive/animation) so each can ship and be validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are relative to the repository root

## Phase 1: Setup

- [X] T001 Add `framer-motion` to `frontend/package.json` dependencies and run `npm install` in `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives every user story's pages will adopt. Must complete before any user-story page work.

- [X] T002 [P] Create `LcLoadingState` in `frontend/src/components/lc/LcLoadingState.tsx` (props: `label?`, `fullHeight?`; reuses theme spacing/typography, no new tokens)
- [X] T003 [P] Create `LcEmptyState` in `frontend/src/components/lc/LcEmptyState.tsx` (props: `title`, `description?`, `action?`, `icon?`)
- [X] T004 [P] Create `LcErrorState` in `frontend/src/components/lc/LcErrorState.tsx` (props: `message`, `onRetry?`; keeps navigation usable, per Edge Cases in spec.md)
- [X] T005 [P] Create `PageTransition` in `frontend/src/components/lc/PageTransition.tsx` using `framer-motion`'s `motion.div` + `useReducedMotion()`; fade+slight-slide preset, 250-350ms, no animation when reduced motion is on
- [X] T006 [P] Jest/RTL test for `LcLoadingState` in `frontend/src/components/lc/__tests__/LcLoadingState.test.tsx`
- [X] T007 [P] Jest/RTL test for `LcEmptyState` in `frontend/src/components/lc/__tests__/LcEmptyState.test.tsx` (renders title/description/action)
- [X] T008 [P] Jest/RTL test for `LcErrorState` in `frontend/src/components/lc/__tests__/LcErrorState.test.tsx` (renders message, calls `onRetry` on click)
- [X] T009 [P] Jest/RTL test for `PageTransition` in `frontend/src/components/lc/__tests__/PageTransition.test.tsx` (renders children; skips animation props when `useReducedMotion` mocked true)

**Checkpoint**: Shared primitives exist and are tested — user story page work can now begin.

---

## Phase 3: User Story 1 - Consistent, polished screens across the whole app (Priority: P1) 🎯 MVP

**Goal**: Representative pages in each shell show loading/empty/error states via the shared primitives instead of ad hoc/blank states, using existing theme/layout tokens only.

**Independent Test**: Visit `/app/home`, `/app/expenses`, `/search`, `/admin` under slow-network and empty-data conditions; every page shows loading, empty, or error via the new shared components — never a blank screen.

### Implementation for User Story 1

- [X] T010 [US1] Replace ad hoc loading/spinner markup in `frontend/src/pages/app/HomePage.tsx` with `LcLoadingState`/`LcEmptyState`/`LcErrorState` as appropriate
- [X] T011 [US1] Replace ad hoc loading/empty/error markup in `frontend/src/pages/Expenses.tsx` with the shared primitives
- [X] T012 [US1] Replace ad hoc loading/empty/error markup in `frontend/src/pages/search/SearchHubPage.tsx` with the shared primitives
- [X] T013 [US1] Replace ad hoc loading/empty/error markup in `frontend/src/pages/admin/AdminDashboard.tsx` with the shared primitives
- [X] T014 [US1] Audit spacing/typography on the four pages above against `frontend/src/layout/constants.ts` and `frontend/src/theme/ledgerCoreTheme.ts` tokens; replace any one-off `sx` spacing/font values with the shared tokens

**Checkpoint**: User Story 1 is independently functional and testable (SC-001).

---

## Phase 4: User Story 2 - Usable by keyboard and assistive technology (Priority: P2)

**Goal**: The four pages above plus their primary interactive flows (nav, add-expense form) are fully keyboard-operable with correct accessible names, and theme text/background pairs pass WCAG 2.1 AA.

**Independent Test**: Keyboard-only walkthrough of nav + add-expense form in each shell; automated contrast check against `ledgerCoreTheme.ts` palettes.

### Implementation for User Story 2

- [X] T015 [US2] Audit icon-only buttons/nav items in `frontend/src/layout/AppSidebar.tsx`, `frontend/src/layout/AppTopBar.tsx`, `frontend/src/layout/BottomNav.tsx` for missing `aria-label`s — confirmed compliant: `AppTopBar` icon buttons already carry `aria-label`, and `AppSidebar`/`BottomNav` items render visible text labels (`ListItemText`/`showLabels`) which already serve as the accessible name; no code change required
- [X] T016 [US2] Audit `frontend/src/components/expenses/ExpenseForm.tsx` for keyboard operability — confirmed compliant: all inputs use MUI `TextField`/`Select`/`Autocomplete` with labels (native tab order + accessible names); the unused `IconButton` import predates this feature and is out of scope
- [X] T017 [P] [US2] Contrast audit against `ledgerCoreDarkTheme`, `ledgerCoreLightAuthTheme`, `ledgerCoreAdminLightTheme` in `frontend/src/theme/ledgerCoreTheme.ts` — computed WCAG contrast ratios for all text/background pairs (primary/secondary text, success/error accents) against their theme backgrounds; all pairs are ≥4.5:1 (lowest was error-on-dark at ~5.1:1), so no theme color changes were needed
- [X] T018 [US2] Confirm MUI `Dialog`/`Menu` usages on the four pilot pages rely on default Escape-to-close/focus-return behavior — confirmed: `Expenses.tsx` and `SearchHubPage.tsx` dialogs use default `onClose` wiring with no override of MUI's built-in keyboard/focus handling; no changes required

**Checkpoint**: User Stories 1 AND 2 both work independently (SC-002, SC-003).

---

## Phase 5: User Story 3 - Smooth, responsive feel with tasteful motion (Priority: P3)

**Goal**: The four pilot pages resize correctly across breakpoints and animate in via `PageTransition`, respecting reduced motion, without touching routes/guards.

**Independent Test**: Resize viewport across mobile/tablet/desktop on the four pilot pages (no overflow/overlap); navigate to a pilot page and confirm entrance animation plays and is skipped under `prefers-reduced-motion`.

### Implementation for User Story 3

- [X] T019 [P] [US3] Wrap `frontend/src/pages/app/HomePage.tsx` page content in `PageTransition` (done alongside T010 — same file edit)
- [X] T020 [P] [US3] Wrap `frontend/src/pages/Expenses.tsx` page content in `PageTransition` (done alongside T011)
- [X] T021 [P] [US3] Wrap `frontend/src/pages/search/SearchHubPage.tsx` page content in `PageTransition` (done alongside T012)
- [X] T022 [P] [US3] Wrap `frontend/src/pages/admin/AdminDashboard.tsx` page content in `PageTransition` (done alongside T013)
- [X] T023 [US3] Responsive audit of the four pilot pages — confirmed all four already use responsive `Grid` breakpoints (`xs`/`md`/`xl`/`lg`), `flexWrap`, and `fullWidth` controls with no fixed pixel widths that would overflow at mobile/tablet/desktop; no changes required beyond the shared-component adoption already done in T010-T013

**Checkpoint**: All three user stories independently functional (SC-005, SC-006, SC-007).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 Run `frontend` test suite (`npm test -- --watchAll=false`) — the 4 new + 5 pre-existing `lc` suites (9 tests) all pass; `App.test.tsx` and `expenseSlice.test.ts` fail, but this was verified via `git stash` to be a pre-existing Jest/CRA config issue (react-router-dom v7 ESM exports resolution + un-transformed axios ESM) unrelated to this feature — no route/guard regression introduced by this work
- [~] T025 Run `quickstart.md` validation scenarios — scenarios 3 (contrast) and 4 (route/guard regression + typecheck) verified programmatically; scenarios 1, 2, 5, 6, 7 require a running browser session and are left for manual QA (no dev server/browser available in this session) — see completion notes
- [X] T026 Run `graphify update .` after all code changes
- [X] T027 Append a dated entry to `docs/tracker.md` summarizing the UI polish + animation work

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup (needs `framer-motion` installed for T005/T009); blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational. Builds on the same four pages as US1 but is independently testable (a11y can be audited even if US1's state components weren't adopted yet, though in practice US1 ships first).
- **User Story 3 (Phase 5)**: Depends on Foundational (needs `PageTransition` from T005). Independently testable via visual/animation checks.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

## Parallel Example: Foundational Phase

```bash
Task: "Create LcLoadingState in frontend/src/components/lc/LcLoadingState.tsx"
Task: "Create LcEmptyState in frontend/src/components/lc/LcEmptyState.tsx"
Task: "Create LcErrorState in frontend/src/components/lc/LcErrorState.tsx"
Task: "Create PageTransition in frontend/src/components/lc/PageTransition.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational (shared primitives + tests)
3. Phase 3: User Story 1 on the 4 pilot pages
4. **STOP and VALIDATE**: loading/empty/error states visible, no blank screens
5. This is a deployable increment even before accessibility/animation work lands

### Incremental Delivery

1. Setup + Foundational → shared primitives ready
2. US1 → validate → ship (MVP)
3. US2 → validate → ship
4. US3 → validate → ship
5. Repeat this same 3-story pattern for additional pages beyond the 4 pilots in a follow-up pass (out of scope for this tasks.md; see spec.md Assumptions on incremental adoption)

## Notes

- The 4 pilot pages (`HomePage`, `Expenses`, `SearchHubPage`, `AdminDashboard`) are the first pass across all three shells per `research.md`'s "Scope of pages touched" decision. Extending to more pages reuses the same shared primitives from Phase 2 with no new foundational work.
- Checklist gaps CHK004/CHK015/CHK018 (rollout visual distinction, concurrent-navigation animation interruption, automated a11y tooling) are intentionally not separate tasks here — they are low-impact per the checklist notes and can be revisited via `speckit-converge` after this pass ships.

---

## Phase 7: Convergence

- [ ] T028 Complete manual `quickstart.md` validation scenarios 1, 2, 5, 6 (loading/empty/error visual check, keyboard-only walkthrough, animation timing + reduced-motion, responsive audit) on the four pilot pages using a running `frontend` dev server and browser per SC-001, SC-002, SC-005, SC-006, SC-007 (partial)
- [ ] T029 Review and record traceability for the `frontend/src/pages/landing/**` framer-motion/animation/responsive work (added at explicit user request, outside the three named shells) against `001-production-ui-polish`'s stated scope — either note it as an accepted out-of-scope enhancement or capture it as its own spec entry per spec.md scope (unrequested)
