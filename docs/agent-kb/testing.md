# Testing

## Where tests live

| Area | Location | Runner |
|------|----------|--------|
| Backend (preferred) | `backend/apps/<app>/tests/test_*.py` | `pytest` |
| Backend (legacy stubs) | `backend/apps/<app>/tests.py` | often empty placeholders — prefer `tests/` package |
| Frontend unit | `**/__tests__/*` or `*.test.ts(x)` | Jest via CRA |
| Golden backend example | `backend/apps/analytics/tests/test_post_game.py` | APIClient + force_authenticate |
| Golden frontend example | `frontend/src/store/slices/__tests__/expenseSlice.test.ts` | Redux slice tests |

## Commands

```bash
# Backend — app or file
cd backend
pytest apps/analytics/tests -q
pytest apps/expenses/tests/test_sync.py -q

# Django system check
python manage.py check

# Frontend types
cd frontend
npx tsc --noEmit

# Frontend tests (CI-style)
npm test -- --watchAll=false --testPathPattern=expenseSlice
```

## What to cover for new behavior

**API / domain**

1. Happy path (200/201 + key fields)
2. Unauthenticated → 401
3. Wrong user / no membership → 403 or 404 (match nearby views)
4. One validation error (bad UUID, bad body)

**Frontend**

- Prefer Redux slices, pure utils, sync helpers over brittle full-page snapshots.
- Testing Library for interactive widgets only when logic is UI-bound.

## Policy

- New behavior → add or update focused tests (`write-tests` skill).
- Failed tests block “done” (`verification.md`).
- Do not require 100% coverage or heavy E2E in agent tasks unless the user asks.
