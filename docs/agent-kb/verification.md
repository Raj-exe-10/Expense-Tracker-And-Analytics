# Verification

Run before claiming a coding task is done. Skill: `.cursor/skills/verify-and-fix/`.

## Command matrix

| Changed paths | Run |
|---------------|-----|
| `frontend/src/**` | `cd frontend && npx tsc --noEmit` |
| UI-heavy frontend | optional `npm run build` after tsc |
| Frontend logic with tests | `npm test -- --watchAll=false --testPathPattern=<area>` |
| `backend/**` | `cd backend && python manage.py check` |
| Touched backend app | `pytest apps/<app> -q` (or specific new test file) |
| Both / unsure | frontend tsc + backend check (+ relevant tests) |

## Parallel review (after implement)

In one batch with compile/tests:

1. **Bugbot** — `Diff: uncommitted changes` (or branch changes if reviewing a branch).
2. **Security Review** — when touching auth, payments, admin, sync, uploads, or when the user asks.

Main agent **fixes** blocking findings; review subagents stay readonly.

## Severity policy

| Severity | Action |
|----------|--------|
| Compile/type errors, failed tests, Critical/High review | **Must fix** before done |
| In-scope Medium | Fix if cheap |
| Low / nit / pre-existing out-of-scope | Report only |

Max **3** verify→fix loops; then report remaining blockers.

## Done means

- Scoped checks/tests green
- Blocking review items fixed or explicitly deferred with reason
- No invented APIs or broken shell routing
