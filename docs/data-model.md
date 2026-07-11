# Data model

PostgreSQL (or SQLite locally). Most domain entities use **UUID** PKs and **timestamps** via `UUIDModel` / `TimeStampedModel` in [`backend/apps/core/models.py`](../backend/apps/core/models.py).

Models live under `backend/apps/*/models.py`. Terms: [glossary.md](glossary.md).

## Auth and core

```mermaid
erDiagram
  User ||--o| UserProfile : has
  User ||--o{ UserDevice : devices
  User ||--o{ UserFriendship : friendships
  User ||--o{ EmailVerification : verifications
  Currency ||--o{ Expense : prices
  Category ||--o{ Expense : categorizes
  Category ||--o{ WalletCategory : assigned
  User ||--o{ ActivityLog : acts
  User ||--o{ SystemLog : optional_actor

  User {
    uuid id
    string email
    string role
    string preferred_currency
  }
  UserProfile {
    string totp_secret
  }
  Currency {
    string code
    string symbol
  }
  Category {
    string name
  }
  SystemLog {
    string level
    string category
    string path
  }
  ActivityLog {
    string action
  }
```

- **SystemLog** — HTTP/API observability (`APILoggingMiddleware`), admin UI `/admin/logs`
- **ActivityLog** — domain activity trail (separate from SystemLog)

## Expenses

```mermaid
erDiagram
  User ||--o{ Expense : paid_by
  Group ||--o{ Expense : optional_group
  Expense ||--o{ ExpenseShare : shares
  User ||--o{ ExpenseShare : owes
  Expense ||--o{ ExpenseComment : comments
  User ||--o{ RecurringExpense : owns
  Currency ||--o{ Expense : currency
  Category ||--o{ Expense : category

  Expense {
    uuid id
    string title
    decimal amount
    string expense_type
    string split_type
    int version
    json ocr_data
    bool is_deleted
  }
  ExpenseShare {
    uuid id
    decimal amount_owed
    decimal amount_paid
  }
  RecurringExpense {
    uuid id
    string frequency
  }
```

`version` powers offline sync — see [flows.md](flows.md) and [feature-status.md](feature-status.md).

## Groups (UI: Squads)

```mermaid
erDiagram
  Group ||--o{ GroupMembership : members
  User ||--o{ GroupMembership : user
  Group ||--o{ GroupInvitation : invites
  Group ||--o{ GroupActivity : activity
  Group ||--o{ Expense : expenses

  Group {
    uuid id
    string name
    string group_type
    string invite_code
  }
  GroupMembership {
    string role
    bool is_active
  }
```

## Payments and settlements

```mermaid
erDiagram
  User ||--o{ Settlement : payer
  User ||--o{ Settlement : payee
  Currency ||--o{ Settlement : currency
  User ||--o{ PaymentMethod : methods
  Settlement ||--o{ Payment : payments
  User ||--o{ PaymentRequest : requests
  PaymentWebhook {
    string service
  }

  Settlement {
    uuid id
    decimal amount
    string status
    string method
  }
```

Debt simplification logic: `backend/apps/payments/debt_simplifier.py` (not a table).

## Budget envelopes

```mermaid
erDiagram
  User ||--o{ Wallet : owns
  Wallet ||--o{ WalletCategory : categories
  Category ||--o{ WalletCategory : system_category
  User ||--o{ MonthlyBudget : budgets
  Currency ||--o{ MonthlyBudget : currency
  MonthlyBudget ||--o{ WalletAllocation : allocations
  Wallet ||--o{ WalletAllocation : wallet
  Wallet ||--o{ WalletAdjustment : whammies
  User ||--o{ FixedCost : fixed_costs
  User ||--o{ SavingsGoal : goals
  User ||--o{ UserCategory : custom_categories

  Wallet {
    uuid id
    string name
    string wallet_type
    bool rollover_enabled
  }
  MonthlyBudget {
    uuid id
    int year
    int month
    decimal total_amount
  }
  WalletAllocation {
    decimal amount
    decimal rollover_from_previous
  }
```

## Enterprise

```mermaid
erDiagram
  Entity ||--o{ AuditEvent : events
  Entity ||--o{ ExportJob : exports
  User ||--o{ AuditEvent : actor

  Entity {
    uuid id
    string name
  }
  AuditEvent {
    string event_type
  }
  ExportJob {
    string status
  }
```

## Analytics and notifications (summary)

- **Analytics:** `ExpenseAnalytics`, `UserSpendingPattern`, `ReportTemplate`, `GeneratedReport`
- **Notifications:** `Notification`, `NotificationPreference`, `NotificationTemplate`, `NotificationLog`

Post-game aggregates are mostly computed in services/views, not only stored rows — see `/api/analytics/post-game/`.
