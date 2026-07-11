# Offline sync

## Protocol

Backend: `backend/apps/expenses/sync_views.py`

- `POST` sync (batched `items`): each item may have `id`, `base_version`, `data`, optional `resolution`.
- If `base_version` ≠ server `expense.version` → **conflict** (local + server payloads returned).
- Successful apply increments `expense.version`.
- Create path: no `id` → create with `version=1`.
- `resolve_conflict`: `choice` `local` | server-side keep; bumps version.

Frontend:

- `frontend/src/services/offlineService.ts` — IndexedDB pending queue, online/offline.
- `syncAPI` in `api.ts`.
- UI: `frontend/src/components/sync/SyncConflictHost.tsx`.

## Agent checklist before changing sync

- [ ] Preserve version compare semantics.
- [ ] Conflict payload shape stays compatible with `SyncConflictHost`.
- [ ] Soft-delete / `is_deleted` handling unchanged unless intentional.
- [ ] Add/adjust tests for mismatch conflict + resolve local.
- [ ] Run Security Review in verify (sync is sensitive).

See skill `.cursor/skills/offline-sync/SKILL.md`.
