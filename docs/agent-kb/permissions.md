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

- Expenses: payer, share participant, or active group member.
- Groups: membership required for mutations.
- Budget wallets/budgets: owner user only.
- Settlements: payer or payee (or group context as existing views do).
- System logs / enterprise: admin-class roles only.

## Input validation

- Validate UUID query/path params before filtering (reject invalid format).
- Validate dates (`YYYY-MM-DD`) and enums explicitly.
- Never trust client-supplied `user_id` to escalate access.

## Tests required

At least: authenticated happy path + unauthenticated 401 + one cross-user denial. See [testing.md](testing.md).
