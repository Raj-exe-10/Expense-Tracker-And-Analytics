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

- `Expense.version` increments on successful apply/resolve.
- Conflict when client `base_version` ≠ server version; return local + server payloads.
- Frontend conflict UI must keep consuming the same conflict shape.
- Soft-delete / `is_deleted` filters stay consistent.

## Checklist

- [ ] `sync_views.py` protocol preserved or intentionally versioned
- [ ] `offlineService.ts` / `syncAPI` / `SyncConflictHost` updated together
- [ ] Tests: version mismatch → conflict; resolve local applies
- [ ] `verify-and-fix` including **Security Review**

Do not “simplify” by dropping version checks.
