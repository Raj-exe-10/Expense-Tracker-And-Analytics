# Domain glossary

| Term | Backend | UI / notes |
|------|---------|------------|
| **Expense** | `expenses.Expense` | Individual or group spend; has `version` for sync |
| **ExpenseShare** | `expenses.ExpenseShare` | Who owes what on an expense |
| **Group** | `groups.Group` | Shared expense group |
| **Squad** | same as Group | Frontend routes/copy use “Squad” (`/app/squads/:id`) |
| **Settlement** | `payments.Settlement` | Payer → payee transfer to clear debt |
| **Wallet** | `budget.Wallet` | Envelope; `regular` or `sinking_fund` |
| **MonthlyBudget** | `budget.MonthlyBudget` | Cap for a user/year/month |
| **WalletAllocation** | `budget.WalletAllocation` | Amount assigned to a wallet in a month |
| **Whammy** | `budget.WalletAdjustment` | One-time adjustment |
| **FixedCost** | `budget.FixedCost` | Recurring fixed obligation |
| **SavingsGoal** | `budget.SavingsGoal` | Goal tracking |
| **Entity** | `enterprise.Entity` | Enterprise supervision unit |
| **SystemLog** | `core.SystemLog` | HTTP/auth/activity logs for admin |
| **Post-game** | analytics post-game APIs | Month-end cash flow / budget vs actual |

## Split modes (expenses)

equal, exact, percentage, shares, adjustment — see `expenses` models/serializers.

## Naming traps

- Always map UI “Squad” → API `groups`.
- Prefer existing `*API` modules in `frontend/src/services/api.ts`; do not invent client paths.
- Admin zone ≠ Django `/admin/` site; SPA admin is `/admin/*` gated by role.
