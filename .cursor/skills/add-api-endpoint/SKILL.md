---
name: add-api-endpoint
description: >-
  Add or change a Django REST API endpoint in LedgerCore and mirror it in the
  frontend api.ts client. Use when creating viewsets, actions, analytics
  routes, or wiring a new /api path.
---

# Add API endpoint

## Steps

1. Choose owning app under `backend/apps/<app>/`.
2. Model/serializer/view (ViewSet or `@api_view`) as nearby code does.
3. Register in that app’s `urls.py` / router.
4. Touch `backend/config/urls.py` only for a **new** top-level prefix.
5. Add method(s) on the matching `*API` object in `frontend/src/services/api.ts`.
6. Complete **permissions checklist** (below).
7. Run skill `write-tests` (happy path + 401 + cross-user denial).
8. Run skill `verify-and-fix`.

## Permissions checklist

- [ ] Who can call? (IsAuthenticated / role / staff)
- [ ] Queryset scoped to owner/membership/admin?
- [ ] UUID/date query params validated?
- [ ] Wrong user gets 403/404 consistent with siblings?
- [ ] Privilege fields (`role`, `is_verified`, `is_premium`) never writable by clients?
- [ ] Client-supplied `payer_id` / `paid_by_id` / `user_id` cannot escalate (force `request.user` or membership check)?
- [ ] Global/admin actions (e.g. process-all, exports) staff- or role-gated and queryset-scoped?
- [ ] Non-idempotent mutations: atomic + `select_for_update` where double-submit matters; UI disables while in flight?

See `docs/agent-kb/api-map.md`, `docs/agent-kb/permissions.md`, and `docs/feature-status.md` (do not assume stub features are live).
