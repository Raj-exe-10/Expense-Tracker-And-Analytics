# Feature Specification: Production UI Polish + Animations

**Feature Branch**: `001-production-ui-polish`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Deliver a production-grade UI polish pass across PersonalShell (/app), SearchShell (/search), and AdminShell (/admin) covering visual consistency (spacing/typography/component reuse), loading/empty/error states, accessibility (keyboard nav, ARIA, contrast), and responsive/performance behavior — while preserving all existing routes, guards, redirects, and data flows exactly as-is. Introduce framer-motion for page-transition and micro-interaction animations on pages built/redesigned as part of this work, to improve user retention."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent, polished screens across the whole app (Priority: P1)

As a signed-in user, when I move between screens in the Personal area (`/app`), the Search/enterprise area (`/search`), and, if I'm an admin, the Admin area (`/admin`), every screen should feel like it belongs to the same product: consistent spacing, typography, and components, with clear feedback while data loads, when a list is empty, and when something goes wrong.

**Why this priority**: This is the core of "production compliant" — without consistent states and visual polish, nothing else (accessibility, animation) matters to perceived quality.

**Independent Test**: Visit representative pages in each of the three shells (e.g. `/app/home`, `/app/expenses`, `/search`, `/admin`) in slow-network and empty-data conditions; every page shows an explicit loading indicator, an empty state with guidance, or an error state with a recovery action — never a blank screen or unstyled browser default.

**Acceptance Scenarios**:

1. **Given** a page that fetches data, **When** the request is in flight, **Then** the user sees a loading indicator styled consistently with the rest of the app (not a blank page).
2. **Given** a page whose data set is empty (e.g. no expenses yet), **When** the page loads, **Then** the user sees an empty state with a short explanation and, where applicable, a call to action.
3. **Given** a page whose data request fails, **When** the error occurs, **Then** the user sees a clear error message and a way to retry, without losing navigation.
4. **Given** any two pages within the same shell, **When** compared side by side, **Then** they use the same spacing scale, typography, and shared components (`PageShell`, `lc/*` primitives) rather than one-off styling.

---

### User Story 2 - Usable by keyboard and assistive technology (Priority: P2)

As a user relying on keyboard navigation or a screen reader, I can operate every primary flow (navigate shells, open a page, submit a form, dismiss a dialog) without a mouse and with correct labels announced.

**Why this priority**: Accessibility is part of "production compliant" and is a legal/UX baseline, but it builds on top of the consistent components from Story 1 rather than being independent of them.

**Independent Test**: Using only the keyboard, tab through the navigation and a representative form (e.g. add expense) in each shell; every interactive element is reachable, has a visible focus state, and exposes an accessible name; run an automated contrast check against the theme's text/background pairs.

**Acceptance Scenarios**:

1. **Given** any interactive element (button, link, input, nav item), **When** navigating with Tab/Shift+Tab, **Then** it receives a visible focus outline and can be activated with Enter/Space.
2. **Given** a dialog or menu is open, **When** the user presses Escape, **Then** it closes and focus returns to the triggering element.
3. **Given** an icon-only button or nav item, **When** inspected by a screen reader, **Then** it exposes a meaningful accessible name (`aria-label` or equivalent).
4. **Given** the app's text/background color pairs, **When** checked against WCAG 2.1 AA contrast ratios, **Then** they pass for normal and large text.

---

### User Story 3 - Smooth, responsive feel on any device, with tasteful motion (Priority: P3)

As a user on a phone, tablet, or desktop, pages resize and reflow correctly at every breakpoint, feel fast, and — on pages built or redesigned as part of this initiative — use subtle motion (page transitions, micro-interactions) that makes the app feel modern without being distracting or slow.

**Why this priority**: Responsiveness and animation are the most visible "delight" layer, but they depend on the consistent layout/components from Story 1 to look intentional rather than patchy.

**Independent Test**: Resize the viewport across mobile/tablet/desktop breakpoints on representative pages in each shell and confirm no horizontal scroll, overlapping content, or unreachable controls; open a page that has been redesigned under this initiative and confirm it animates in on entry and that reduced-motion preference disables/minimizes the animation.

**Acceptance Scenarios**:

1. **Given** a page in any shell, **When** viewed at mobile, tablet, and desktop widths, **Then** all content and controls remain usable with no horizontal overflow or overlapping elements.
2. **Given** a page redesigned under this initiative, **When** the user navigates to it, **Then** it plays a brief entrance animation (e.g. fade/slide) that does not block interaction and completes quickly.
3. **Given** the user's OS/browser is set to reduce motion, **When** they view an animated page, **Then** animations are disabled or reduced to an instant/near-instant state.
4. **Given** an existing route, guard, or redirect (e.g. legacy `/dashboard` → `/app/home`), **When** this initiative ships, **Then** the route, its guard behavior, and its destination are unchanged.

---

### Edge Cases

- What happens on a page whose data legitimately never loads (e.g. offline, backend down)? Error state must offer retry and must not trap the user (navigation stays usable).
- What happens if a user's role changes mid-session (e.g. loses admin) — does the polished AdminShell still enforce the existing `AdminGuard` redirect behavior unchanged?
- What happens for a user with `prefers-reduced-motion` enabled — animations must be skipped or reduced, not just shortened.
- What happens on very small (narrow mobile) and very large (ultra-wide desktop) viewports — layout must not break at either extreme.
- What happens when a page is mid-animation and the user navigates away quickly — no stuck/half-animated UI or memory leaks from unmounted animated components.
- What happens to a page that is out of scope for this pass (not redesigned) — it must continue working exactly as before; this initiative does not silently change unreviewed pages' behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every data-fetching page across PersonalShell, SearchShell, and AdminShell MUST present one of: a styled loading state, a styled empty state, or a styled error state with retry — never an unstyled blank state.
- **FR-002**: All polished pages MUST reuse existing shared layout and primitive components (`PageShell`, `AppTopBar`, `DesktopShellLayout`, `layout/constants.ts` tokens, `components/lc/*`) rather than introducing parallel/duplicate styling patterns.
- **FR-003**: All existing routes, redirects (including legacy path redirects into `/app/*`), and guard behaviors (`AuthGuard`, `AdminGuard`, `PublicGuard`) MUST remain functionally unchanged after this initiative.
- **FR-004**: All interactive elements (buttons, links, form inputs, nav items, menus, dialogs) MUST be operable via keyboard alone, with a visible focus indicator and a correct accessible name.
- **FR-005**: Dialogs and menus MUST close on Escape and return focus to the triggering element.
- **FR-006**: Text/background color combinations used across the polished UI MUST meet WCAG 2.1 AA contrast ratios for normal and large text.
- **FR-007**: All polished pages MUST render without horizontal overflow, overlapping content, or unreachable controls across mobile, tablet, and desktop breakpoints.
- **FR-008**: Pages built or redesigned as part of this initiative MUST use `framer-motion` for entrance/transition and key micro-interaction animations, applied consistently via a shared animation wrapper/pattern rather than ad hoc per-page implementations.
- **FR-009**: All animations introduced by this initiative MUST respect the user's `prefers-reduced-motion` setting by disabling or minimizing motion.
- **FR-010**: Pages and shells not touched by this initiative MUST continue to function exactly as before (no behavioral regression outside the polished scope).
- **FR-011**: The visual language (spacing scale, typography, color tokens) used across all three shells MUST derive from the existing theme sources (`theme/ledgerCoreTheme.ts`, `layout/constants.ts`) rather than new, competing token sets.

### Key Entities

*(Not applicable — this is a UI/UX presentation-layer initiative with no new data entities; it consumes existing data already exposed by current pages/APIs.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pages across the three shells display an explicit loading, empty, or error state instead of a blank screen during data fetches, in a manual audit of all in-scope pages.
- **SC-002**: 100% of primary flows (navigation, add/edit expense, settlements, admin review) can be completed using keyboard-only navigation, verified by manual keyboard-only walkthrough.
- **SC-003**: All checked text/background color pairs in the app theme pass WCAG 2.1 AA contrast, verified by an automated contrast audit.
- **SC-004**: Zero regressions in existing route/redirect/guard behavior, verified by the existing route/guard test suite passing unchanged after implementation.
- **SC-005**: Pages redesigned under this initiative load their entrance animation within 300ms of navigation and the animation itself completes within 500ms, so motion never delays perceived usability.
- **SC-006**: Users with `prefers-reduced-motion` enabled see no motion-induced delay or distraction on any polished page, verified by manual testing with the OS setting enabled.
- **SC-007**: No layout breakage (horizontal scroll, overlap, unreachable controls) is observed across mobile, tablet, and desktop breakpoints on any in-scope page, verified by manual responsive audit.

## Assumptions

- "Production compliant" is interpreted as: visual consistency, explicit loading/empty/error states, accessibility (WCAG 2.1 AA), and responsive/performance behavior — the four areas the user selected — rather than infrastructure/deployment concerns (which are out of scope for this UI-focused spec).
- All three shells (PersonalShell, SearchShell, AdminShell) are in scope, but the exact set of pages touched in a single implementation pass will be prioritized by the technical plan; pages not yet touched keep working exactly as they do today (no big-bang rewrite requirement).
- "New pages" needing animation means pages built or visually redesigned as part of this initiative going forward, not a fixed list of pre-existing pages that must retroactively gain animation.
- `framer-motion` is added as a new frontend dependency, per explicit user choice, for page-transition and micro-interaction animation; existing MUI transition primitives remain available for simple cases.
- No new backend/API work is required; this initiative is presentation-layer only and consumes existing `*API` modules and Redux slices unchanged.
- Existing automated test suites (route guards, page smoke tests) are assumed to exist or will be added where needed per `write-tests`, and must continue to pass.
