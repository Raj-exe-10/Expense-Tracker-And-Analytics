# Quickstart: Validating Production UI Polish + Animations

## Prerequisites

- `frontend/` dependencies installed (`npm install` inside `frontend/`), including `framer-motion` after it's added to `frontend/package.json`.
- A local backend running (or mocked) so pages have real loading/empty/error data conditions to exercise.

## Setup

```bash
cd frontend
npm install
npm start
```

## Validation scenarios

1. **Loading/empty/error states (SC-001)**
   - Throttle network (DevTools → Network → Slow 3G) and open a polished page (e.g. `/app/home`) — expect a styled loading state, not a blank screen.
   - Use an account/group with no expenses and open `/app/expenses` — expect a styled empty state with guidance.
   - Stop the backend and reload a polished page — expect a styled error state with a retry action that stays navigable.

2. **Keyboard-only walkthrough (SC-002)**
   - Unplug the mouse (or avoid using it) and Tab through the shell navigation and the add-expense form; confirm every control is reachable, has a visible focus ring, and activates with Enter/Space; confirm Escape closes any open dialog/menu and returns focus to the trigger.

3. **Contrast audit (SC-003)**
   - Run an automated contrast checker (e.g. axe DevTools browser extension, or `npx @axe-core/cli http://localhost:3000/app/home`) against the dark app theme, light auth theme, and light admin theme; confirm no AA contrast failures on text/background pairs.

4. **Route/guard regression (SC-004)**
   - Run the existing frontend test suite: `npm test -- --watchAll=false`.
   - Manually hit a legacy path (e.g. `/dashboard`, `/expenses`) and confirm it still redirects into `/app/*`; confirm `/admin/*` still redirects non-admins away.

5. **Animation timing + reduced motion (SC-005, SC-006)**
   - Navigate to a page wrapped in `PageTransition`; confirm the entrance animation starts near-instantly and finishes well under 500ms (visually, or via the Performance panel).
   - Enable "Reduce motion" at the OS level (or `prefers-reduced-motion: reduce` in DevTools rendering emulation) and reload the same page; confirm it appears instantly with no animated transform/opacity.

6. **Responsive audit (SC-007)**
   - In DevTools device toolbar, check the polished pages at a narrow mobile width (~360px), a tablet width (~768px), and a wide desktop width (~1920px); confirm no horizontal scrollbar, no overlapping elements, and all controls remain reachable.

## Expected outcome

All six scenarios pass without modifying any route path, guard, or redirect behavior, and without regressing pages outside this initiative's scope.
