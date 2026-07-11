# Budget envelopes

Hierarchy: **MonthlyBudget → Wallet (envelope) → categories**.

## Models (`backend/apps/budget/models.py`)

- **Wallet** — per-user; `regular` (optional rollover) or `sinking_fund`.
- **WalletCategory** — maps system `Category` to one wallet per user.
- **UserCategory** — user-defined categories where used.
- **MonthlyBudget** — year/month total for a user + currency.
- **WalletAllocation** — amount (and rollover) for a wallet in that month.
- **WalletAdjustment** (“whammy”) — one-time adjustment.
- **FixedCost**, **SavingsGoal** — supporting budget features.

## API / UI

- Backend: `/api/budget/` → `budgetAPI`, `fixedCostsAPI` in `api.ts`.
- UI: `/app/budget` → `frontend/src/pages/Budget.tsx`.
- Post-game analytics consumes budget + income for cash-flow (`/app/analytics/post-game`).

## Agent rules

- Keep wallet uniqueness (`user` + `name`) and category→single-wallet invariant.
- Do not bypass serializers for allocation math; follow existing service helpers if present.
- Add tests for allocation/rollover edge cases when changing compute logic.
