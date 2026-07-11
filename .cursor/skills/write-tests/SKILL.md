---
name: write-tests
description: >-
  Write focused backend pytest/APIClient and frontend Jest/Testing Library tests
  for LedgerCore. Use when adding API behavior, domain logic, Redux slices,
  sync/conflicts, auth, or when the user asks for tests or coverage.
---

# Write tests

## Policy

New or changed behavior → add focused tests before done. Prefer real suites under `apps/<app>/tests/` over empty `tests.py` stubs.

## Backend

- File: `backend/apps/<app>/tests/test_<feature>.py`
- Pattern: `APIClient` + `force_authenticate` (see `apps/analytics/tests/test_post_game.py`)
- Cover: happy path, unauthenticated 401, one cross-user denial, one validation error
- Run: `cd backend && pytest apps/<app>/tests/test_<feature>.py -q`

## Frontend

- File: colocated `__tests__/` or `*.test.ts(x)`
- Prefer slices/utils (see `store/slices/__tests__/expenseSlice.test.ts`)
- Run: `cd frontend && npm test -- --watchAll=false --testPathPattern=<name>`

## Then

Include new tests in `verify-and-fix`. Details: `docs/agent-kb/testing.md`. Snippets: [examples.md](examples.md).
