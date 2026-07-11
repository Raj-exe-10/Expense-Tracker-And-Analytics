# Permissions checklist

Every new or changed endpoint must answer:

1. **Who can call it?** (`IsAuthenticated`, role check, object-level?)
2. **What queryset?** (own rows, group membership, admin-all?)
3. **What happens for the wrong user?** (404 vs 403 — be consistent with nearby views)

## Role matrix (SPA)

| Role | `/app` | `/search` | `/admin` |
|------|--------|-----------|----------|
| `user` / `premium` | yes | yes (auth) | no |
| `admin` / `enterprise_admin` | yes | yes | yes |

Backend may still expose enterprise APIs only to elevated roles — mirror checks server-side; never rely on the SPA alone.

## Queryset rules of thumb

- Expenses: payer, share participant, or active group member (including **sync** and **resolve**).
- Groups: membership required for mutations.
- Budget wallets/budgets/allocations/categories: owner user only — verify `wallet.user` / `budget.user == request.user`.
- Settlements: payer or payee; create always sets `payer=request.user`.
- System logs / enterprise: admin-class roles only; exports scoped to caller-accessible expenses.
- Global catalog (Category/Tag) mutations: staff/admin only; list may be broader.
- Recurring `process_all` (and similar fan-out jobs): staff/admin only — never any authenticated user.

## Privilege and identity fields

- Never make `role`, `is_verified`, or `is_premium` writable on public serializers.
- Ignore or override client `payer_id` / `paid_by_id` unless membership-validated; default to `request.user`.
- Friendship create: force `status='pending'`; ignore client `status`.
- App-lock PIN verify: authenticated user only; do not accept client `user_id`; do not reuse login lockout fields for PIN failures.

## Input validation

- Validate UUID query/path params before filtering (reject invalid format).
- Validate dates (`YYYY-MM-DD`) and enums explicitly.
- Never trust client-supplied `user_id` to escalate access.
- Validate `shares_data` participants against group membership (create **and** update).

## Concurrency (sensitive mutations)

- Payment request approve/dispute, settlement confirm/complete: `transaction.atomic()` + `select_for_update()`.
- Sync apply/resolve: same locking pattern + version check.

## Tests required

At least: authenticated happy path + unauthenticated 401 + one cross-user denial. See [testing.md](testing.md).
