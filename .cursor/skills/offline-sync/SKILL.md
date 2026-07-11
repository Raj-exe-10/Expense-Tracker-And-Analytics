---
name: offline-sync
description: >-
  Change LedgerCore offline expense sync and conflict resolution safely. Use
  when editing sync_views, expense version fields, offlineService, SyncConflictHost,
  or syncAPI.
---

# Offline sync

## Read first

`docs/agent-kb/offline-sync.md`

## Critical invariants

- **Ownership:** every sync/resolve lookup must use the accessible-expense queryset (payer, share participant, or active group member). Never `Expense.objects.get(id=...)` alone — that is an IDOR.
- **OCC:** expose read-only `version` on `ExpenseSerializer`. Updates require client `base_version`; mismatch or missing `base_version` → conflict (do not silent last-write-wins).
- **Locking:** apply updates inside `transaction.atomic()` + `select_for_update()`.
- **Version bumps:** increment `version` only when data actually changes (not on “keep server”).
- **Frontend queue:** single sync path via `/api/expenses/sync/` — do **not** re-POST the same pending items to `/expenses/expenses/`. Use a `syncInFlight` mutex (and prefer cross-tab lock if adding multi-tab support).
- **Tokens:** never persist JWT in IndexedDB; read from `tokenStorage` at sync time. Use `REACT_APP_API_URL` for all offline fetches (not relative `/api/...`).
- Soft-delete / `is_deleted` filters stay consistent.

## Checklist

- [ ] `sync_views.py` protocol preserved or intentionally versioned
- [ ] Lookups scoped; row locks on apply/resolve
- [ ] `offlineService.ts` / `syncAPI` / `SyncConflictHost` updated together
- [ ] Tests: IDOR denied; version mismatch → conflict; resolve local applies; unauthenticated 401
- [ ] `verify-and-fix` including **Security Review**

Do not “simplify” by dropping version checks or ownership filters.
