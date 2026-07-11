# Glossary

Short product and domain terms for LedgerCore humans. Agent-oriented twin: [`agent-kb/domain-glossary.md`](agent-kb/domain-glossary.md).

## Product

| Term | Meaning |
|------|---------|
| **LedgerCore** | Brand name used in the SPA (shells, landing, theme) |
| **Expense Tracker** | Repository / historical project name |
| **Personal zone** | Authenticated product UI under `/app` (`PersonalShell`) |
| **Search zone** | Authenticated search/enterprise-style UI under `/search` |
| **Admin zone** | Elevated UI under `/admin` for `admin` / `enterprise_admin` |
| **Landing** | Marketing site at `/` |

## People and access

| Term | Meaning |
|------|---------|
| **User roles** | `user`, `premium`, `admin`, `enterprise_admin` |
| **Squad** | UI name for a shared **Group** (`groups.Group`, `/api/groups/`) |
| **Group membership** | Link between user and group (`GroupMembership`) |

## Money and splitting

| Term | Meaning |
|------|---------|
| **Expense** | A spend record (`expenses.Expense`), individual or group |
| **ExpenseShare** | How much each participant owes/paid on an expense |
| **Split types** | `equal`, `exact`, `percentage`, `shares`, `adjustment` |
| **Settlement** | Transfer from payer to payee to clear debt |
| **Balances** | Net amounts owed between people/groups |
| **Debt simplification** | Algorithm reducing N debts to fewer settlements (`debt_simplifier.py`) |

## Budget

| Term | Meaning |
|------|---------|
| **Wallet / envelope** | Budget bucket (`budget.Wallet`); `regular` or `sinking_fund` |
| **MonthlyBudget** | Cap for a user for a given year/month |
| **WalletAllocation** | Amount assigned to a wallet inside a monthly budget |
| **Whammy** | One-time `WalletAdjustment` |
| **Rollover** | Unused regular-wallet amount carried to next month when enabled |
| **Fixed cost** | Recurring obligation (`FixedCost`) |
| **Savings goal** | Target savings (`SavingsGoal`) |

## Analytics and ops

| Term | Meaning |
|------|---------|
| **Post-game** | Month-end style analytics (cash flow, budget vs actual, insights) |
| **SystemLog** | HTTP/API/ops log rows for admins (`core.SystemLog`) |
| **ActivityLog** | Domain activity trail (`core.ActivityLog`) — not the same as SystemLog |
| **Entity** | Enterprise supervision unit (`enterprise.Entity`) |
| **Offline sync** | Batched expense sync with `version` / conflict resolution |
| **version (expense)** | Integer optimistic concurrency field for sync |

## Stack shorthand

| Term | Meaning |
|------|---------|
| **DRF** | Django REST Framework |
| **JWT** | JSON Web Tokens (access + refresh) |
| **OpenAPI / Spectacular** | Live API docs at `/api/docs/` |
