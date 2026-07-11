# Offline sync

## Protocol

Backend: `backend/apps/expenses/sync_views.py`

- Lookups use accessible queryset only (payer / share / active group member) + `select_for_update` inside `atomic`.
- `POST` sync (batched `items`): each item may have `id`, `base_version`, `data`, optional `resolution`.
- Updates **require** `base_version`; missing → conflict `base_version_required`. Mismatch → conflict with local + server payloads.
- Successful apply increments `expense.version` only when data changes (“keep server” does not bump).
- Create path: no `id` → create with `version=1`, `paid_by=request.user`.
- `resolve_conflict`: `choice` `local` | server keep; optional `base_version` check on local; ownership scoped.

Frontend:

- `frontend/src/services/offlineService.ts` — IndexedDB pending queue, `syncInFlight` mutex, online/offline.
- Batch sync only via `/api/expenses/sync/` — do not re-POST applied items to create endpoint.
- Do not store access tokens in IndexedDB; use `tokenStorage` + `REACT_APP_API_URL` at sync time.
- `syncAPI` in `api.ts`; UI: `SyncConflictHost.tsx` (guard Resolve while in flight; handle errors).

## Agent checklist before changing sync

- [ ] Preserve version compare + ownership scoping.
- [ ] Conflict payload shape stays compatible with `SyncConflictHost`.
- [ ] Soft-delete / `is_deleted` handling unchanged unless intentional.
- [ ] Add/adjust tests for IDOR denial, mismatch conflict, resolve local, 401.
- [ ] Run Security Review in verify (sync is sensitive).

See skill `.cursor/skills/offline-sync/SKILL.md`.
