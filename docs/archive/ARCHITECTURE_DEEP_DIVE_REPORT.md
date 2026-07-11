# Expense Tracker & Analytics — 360° Architecture Deep-Dive Report

**Date:** March 2, 2026  
**Scope:** Full-stack Django 4.2 / React 18 expense tracker with group splitting, settlements, analytics, and budgeting  
**Objective:** Enterprise-readiness assessment targeting 100,000+ concurrent users

---

## Table of Contents

1. [Architectural Fallbacks & Scalability Bottlenecks](#1-architectural-fallbacks--scalability-bottlenecks)
2. [System Reliability & Testability](#2-system-reliability--testability)
3. [Security & Data Integrity](#3-security--data-integrity)
4. [Uncharted UX Gaps & Logical Flaws](#4-uncharted-ux-gaps--logical-flaws)
5. [The "Level-Up" Roadmap](#5-the-level-up-roadmap)
6. [Prioritized Action Plan](#6-prioritized-action-plan)

---

## 1. Architectural Fallbacks & Scalability Bottlenecks

### 1.1 Database Design

#### CRITICAL: SQLite in Production Path

The single most dangerous configuration issue: `settings.py` hardcodes SQLite and the commented-out PostgreSQL block doesn't even use `DATABASE_URL` — meaning **Docker Compose will spin up a PostgreSQL container that nothing connects to**.

```python
# settings.py lines 111-116 — ACTIVE configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

Docker Compose sets `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/expense_tracker`, but `settings.py` never reads it. The fix:

```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}
```

**Impact at 100k users:** SQLite has a single-writer lock. Under concurrent write load, you'll hit `database is locked` errors within minutes. This is a deployment-blocking issue.

#### Missing Indexes for Common Query Patterns

The models have good composite indexes, but several high-frequency query patterns are unindexed:

| Query Pattern | Location | Missing Index |
|---|---|---|
| `ExpenseShare.filter(user=X, is_settled=False)` | `user_balances`, `expense_settlements`, `transaction_history` | Partial index on `(user, is_settled) WHERE is_settled = FALSE` |
| `Expense.filter(Q(paid_by=user) \| Q(shares__user=user))` | Every analytics view | Needs a covering index or materialized view |
| `Notification.filter(user=X, is_read=False)` | Real-time badge count | Partial index on `(user_id) WHERE is_read = FALSE` |
| `Settlement.filter(status='pending')` | Settlement dashboard | Partial index on `(payer, payee) WHERE status = 'pending'` |

PostgreSQL partial indexes would dramatically reduce I/O for these hot paths:

```sql
CREATE INDEX idx_expense_shares_unsettled 
ON expense_shares (user_id, paid_by_id) 
WHERE is_settled = FALSE;

CREATE INDEX idx_notifications_unread 
ON notifications (user_id, created_at DESC) 
WHERE is_read = FALSE;
```

#### N+1 Query Explosions

**`user_balances` view (payments/views.py lines 140-278)** — the worst offender:

```python
# Line 219: User.objects.get(id=other_user_id) — INSIDE A LOOP
for other_user_id, amounts in balances.items():
    try:
        other_user = User.objects.get(id=other_user_id)  # N+1!
```

Then again at lines 250-251:

```python
for txn in simplified_transactions:
    from_user = User.objects.get(id=txn['from'])   # N+1!
    to_user = User.objects.get(id=txn['to'])       # N+1!
```

For a user with 20 unique counterparties, this fires **40+ individual SQL queries** per request. Fix:

```python
user_ids = set(balances.keys())
for txn in simplified_transactions:
    user_ids.add(txn['from'])
    user_ids.add(txn['to'])

users_map = {
    str(u.id): u 
    for u in User.objects.filter(id__in=user_ids)
}
```

**`dashboard_stats` view (analytics/views.py lines 86-97)** — O(N) queries for daily trend:

```python
current_date = start_date
while current_date <= end_date:
    day_total = expenses_qs.filter(expense_date=current_date).aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')
    current_date += timedelta(days=1)
```

For a 30-day range, this fires **30 separate aggregate queries**. Compare with the `expense_trends` view which correctly does it in one query:

```python
# This is the correct pattern (already in expense_trends)
trends = expenses_qs.values('expense_date').annotate(
    amount=Sum('amount'), count=Count('id')
).order_by('expense_date')
```

**`GroupViewSet.balances` (groups/views.py lines 340-381)** — iterates all expenses then all shares:

```python
for expense in expenses:                          # Query 1: all expenses
    balances[expense.created_by.id]['paid'] += ... 
    shares = expense.shares.all()                  # N+1: per-expense share query
    for share in shares:
        ...
```

This should be a single aggregate query:

```python
ExpenseShare.objects.filter(
    expense__group=group, expense__is_settled=False
).values('user_id', 'paid_by_id').annotate(
    total=Sum('amount')
)
```

#### Denormalization Risks

`Group.member_count`, `Group.total_expenses`, and `Group.settled_amount` are denormalized counters updated in application code. Without database triggers, these drift:

- `member_count` is updated in `add_member`, `remove_member`, `join_by_code`, `perform_create` — but **not** in `leave` (groups/views.py line 223: `membership.delete()` without updating count).
- `total_expenses` is updated via `ExpenseService.update_group_total_expenses` but only on create/update/delete — **bulk operations bypass it**.
- `settled_amount` is never updated anywhere in the codebase.

### 1.2 API Design

#### Over-Fetching

**`ExpenseSerializer`** returns the full nested `paid_by`, `category`, `group`, `currency`, and all `shares` objects for every expense in a list view. A page of 20 expenses includes:

```
20 expenses × (paid_by object + category object + currency object + 
  group object + N shares × user object) = potentially 200+ nested objects
```

The list endpoint should use a lightweight serializer and let the detail endpoint return the full graph.

**`GroupViewSet.get_queryset`** prefetches `activities` for every group list — fetching potentially thousands of activity records just to show a group dropdown:

```python
.prefetch_related('memberships__user', 'activities')  # 'activities' is overkill for list
```

#### Under-Fetching

The **Dashboard** page (Dashboard.tsx) makes **5 separate API calls** on mount:

1. `fetchAnalyticsSummary` → `/api/analytics/dashboard/`
2. `fetchExpenses` → `/api/expenses/expenses/`
3. `fetchGroups` → `/api/groups/groups/`
4. `settlementsAPI.getUserBalances()` → `/api/payments/balances/`
5. `notificationsAPI.getNotifications()` → `/api/notifications/notifications/`

This should be a single `/api/dashboard/` endpoint that aggregates all dashboard data server-side, reducing 5 round-trips to 1.

#### Inconsistent Response Shapes

Some views return paginated responses (`{ results: [], count: N }`), others return raw arrays. The frontend has to handle both:

```typescript
// expenseSlice.ts lines 181-186
state.expenses = Array.isArray(payload)
  ? payload
  : (Array.isArray(payload?.results) ? payload.results : []);
```

`GroupViewSet` sets `pagination_class = None`, bypassing the global pagination setting — meaning it'll return **all** groups in a single response with no limit.

#### Hardcoded Currency

Multiple views hardcode `'USD'` regardless of the expense's actual currency:

```python
# payments/views.py line 229, 239, 259, 343, 692
'currency': 'USD',
```

This silently corrupts multi-currency balances.

### 1.3 State Management (Frontend)

#### Dual State Systems in Conflict

The app has **two competing state systems** running simultaneously:

1. **Redux Store** (`store/slices/`) — used by Dashboard, Expenses, Groups, Analytics
2. **AppContext** (`context/AppContext.tsx`) — uses `localStorage` with mock data, used by `GroupsNew.tsx`, `ExpenseList.tsx`

`GroupsNew.tsx` uses `AppContext` with mock/localStorage groups, while `Groups.tsx` uses Redux with real API data. A user navigating between these sees inconsistent data.

#### No Request Deduplication or Caching

Every navigation to `/dashboard` re-fires all 5 API calls. There's no:
- Stale-while-revalidate pattern
- Request deduplication (clicking "Refresh" during an in-flight request fires a duplicate)
- Cache invalidation strategy

React Query or RTK Query would solve all of these:

```typescript
// What it should look like with RTK Query
const { data, isLoading, refetch } = useGetDashboardQuery(
  { startDate, endDate },
  { pollingInterval: 60000 }  // auto-refresh every 60s
);
```

#### Unnecessary Re-Renders

`Dashboard.tsx` has **7 separate `useState` hooks**, several of which trigger re-renders of the entire component tree:

```typescript
const [pendingSettlements, setPendingSettlements] = useState(...)
const [loading, setLoading] = useState(true)
const [refreshing, setRefreshing] = useState(false)
const [recentActivities, setRecentActivities] = useState(...)
const [snackbar, setSnackbar] = useState(...)
```

Each `setPendingSettlements`, `setRecentActivities`, etc. triggers a full re-render of all 6 `StatCard` components, the budget progress bar, the expense list, and the activity feed — even when only one piece of data changed.

#### Token Storage Inconsistency

`storage.ts` uses `sessionStorage`:
```typescript
sessionStorage.setItem('access_token', token);
```

But `authSlice.ts` line 274-275 reads from `localStorage`:
```typescript
localStorage.getItem('access_token')
```

This means `checkAuthStatus` will fail to find tokens after a page refresh if they were stored in `sessionStorage`, causing unexpected logouts.

---

## 2. System Reliability & Testability

### 2.1 Code Testability

#### Tightly Coupled Business Logic in Views

The `split_equally` action (expenses/views.py line 97) contains business logic directly in the view:

```python
share_amount = expense.amount / len(user_ids)
for user_id in user_ids:
    ExpenseShare.objects.create(
        expense=expense,
        user_id=user_id,
        amount=share_amount,
        ...
    )
```

This same logic exists in **three places**:
1. `Expense._create_group_expense_shares()` (models.py line 222)
2. `ExpenseService.create_equal_shares()` (services.py line 18)
3. `ExpenseViewSet.split_equally()` (views.py line 97)

Each implements splitting differently:
- The model method uses `ROUND_HALF_UP` rounding
- The service method does raw division (no rounding)
- The view method does raw division (no rounding)

To test splitting behavior, you'd need to test all three codepaths — and they'll give different results for amounts like `$10.00 / 3 = $3.33` (model) vs `$3.333333...` (service/view).

#### Model `save()` with Side Effects

`Expense.save()` calls `full_clean()` and conditionally calls `create_expense_shares()`:

```python
def save(self, *args, **kwargs):
    self.full_clean()          # Validation in save — unusual, will break bulk operations
    ...
    super().save(*args, **kwargs)
    if not self.shares.exists():
        self.create_expense_shares()  # Side effect: creates related objects
```

This means:
- `Expense.objects.bulk_create()` won't create shares (bypasses `save()`)
- `Expense.objects.update()` won't validate (bypasses `save()`)
- Unit tests that create expenses will have unexpected share creation
- The `_skip_share_creation` flag is referenced in the docstring but **the serializer's `create()` method never sets it** — so shares can be double-created (once by serializer at line 460, once by model's `save()` if the `shares.exists()` check runs before the serializer's shares are committed)

#### Untestable Notification Coupling

Every settlement and expense operation has inline notification creation:

```python
# payments/views.py line 85-100
from apps.notifications.services import NotificationService
NotificationService.create_notification(...)
```

If the notification service fails, should the settlement fail? Currently it's mixed — some paths have try/except, others don't. This makes it impossible to test settlement logic in isolation.

### 2.2 CI/CD & Automation

**There is zero CI/CD infrastructure.** No GitHub Actions, no Jenkinsfile, no `.gitlab-ci.yml`. The `docs/DEVELOPER_GUIDE.md` mentions GitHub Actions but none exist.

A production-ready pipeline needs at minimum:

```yaml
# .github/workflows/ci.yml — what should exist
name: CI
on: [push, pull_request]
jobs:
  backend-tests:
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt
      - run: python manage.py test --parallel
      - run: coverage run manage.py test && coverage report --fail-under=80

  frontend-tests:
    steps:
      - run: npm ci
      - run: npm test -- --coverage --watchAll=false
      - run: npx eslint src/ --max-warnings=0

  security-scan:
    steps:
      - run: pip-audit -r requirements.txt
      - run: npm audit --audit-level=high
      - run: bandit -r backend/apps/ -ll

  docker-build:
    steps:
      - run: docker compose build
      - run: docker compose up -d
      - run: curl --retry 10 --retry-delay 3 http://localhost:8000/api/core/health/
```

Additionally missing:
- **Database migration safety check** — no way to verify migrations don't lock tables
- **Dependency vulnerability scanning** — `requirements.txt` has exact versions from 2023 (Django 4.2.7, not latest 4.2.x patch)
- **Pre-commit hooks** — no `.pre-commit-config.yaml`
- **Environment parity** — dev uses SQLite, Docker uses PostgreSQL (different), production unknown

### 2.3 Concurrency & Race Conditions

#### CRITICAL: Settlement Double-Spend

Two users can settle the same `ExpenseShare` simultaneously. The `settle_expense_share` view (payments/views.py line 547):

```python
share = ExpenseShare.objects.get(id=share_id)   # Read
if share.is_settled:                             # Check
    return Response({'detail': 'Already settled'})
share.is_settled = True                          # Write
share.save()                                     # Commit
```

This is a textbook TOCTOU (Time-of-Check-Time-of-Use) race condition. Between the `get()` and `save()`, another request can read the same `is_settled=False` state.

**Fix with `select_for_update`:**

```python
from django.db import transaction

with transaction.atomic():
    share = ExpenseShare.objects.select_for_update().get(id=share_id)
    if share.is_settled:
        return Response({'detail': 'Already settled'})
    share.is_settled = True
    share.settled_at = timezone.now()
    share.save()
```

#### Group Balance Settlement Race

The `settle_all` action (groups/views.py line 394) uses a bulk `update()`:

```python
count = Expense.objects.filter(
    group=group, is_settled=False
).update(is_settled=True, settled_at=timezone.now())
```

This updates expenses but **does not update the corresponding `ExpenseShare` records**. After `settle_all`, `ExpenseShare.is_settled` remains `False`, so balance calculations still show debts.

Additionally, `settled_at` doesn't exist on the `Expense` model — this `update()` call will raise a `FieldError` at runtime.

#### Non-Atomic Group Member Count

```python
# groups/views.py line 539
group.member_count = group.memberships.filter(is_active=True).count()
group.save(update_fields=['member_count'])
```

If two members join simultaneously, both read `count()`, both get the same number, and one write is lost. Use `F()` expressions:

```python
from django.db.models import F
Group.objects.filter(id=group.id).update(
    member_count=F('member_count') + 1
)
```

#### Expense Share Creation During Split Update

`update_split` (models.py line 278) deletes all shares then recreates them:

```python
def update_split(self, split_type, split_data):
    self.shares.all().delete()       # Window where expense has ZERO shares
    self.create_expense_shares()     # Shares recreated
```

If a balance calculation runs between the delete and recreate, it'll see zero debt — potentially allowing someone to "settle" a non-existent balance.

---

## 3. Security & Data Integrity

### 3.1 Financial Math Risks

#### Equal Split Rounding Drift

The model's equal split (models.py line 227):

```python
share_amount = (self.amount / len(active_members)).quantize(
    Decimal('0.01'), rounding=ROUND_HALF_UP
)
```

For `$10.00 / 3`:
- Each share: `$3.33` (rounds down)
- Total shares: `$9.99`
- **$0.01 vanishes into thin air**

For `$10.00 / 7`:
- Each share: `$1.43` (rounds up)
- Total shares: `$10.01`
- **$0.01 appears from nowhere**

The `is_fully_shared()` check uses a `$0.01` tolerance, masking the problem:

```python
def is_fully_shared(self):
    return abs(self.amount - self.get_total_shares()) < Decimal('0.01')
```

**Production fix** — assign the remainder to the first (or last) share:

```python
def _create_group_expense_shares(self):
    members = list(self.group.get_active_members())
    count = len(members)
    base_share = (self.amount / count).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    remainder = self.amount - (base_share * count)
    
    for i, membership in enumerate(members):
        share_amount = base_share + (remainder if i == 0 else Decimal('0'))
        ExpenseShare.objects.get_or_create(
            expense=self,
            user=membership.user,
            defaults={
                'amount': share_amount,
                'paid_by': self.paid_by,
                'currency': self.currency,
            }
        )
```

#### Decimal-to-Float Conversion

The `DebtSimplifier` converts Decimal to float in output:

```python
# debt_simplifier.py line 63
simplified.append({
    'from': debtor_id,
    'to': creditor_id,
    'amount': float(transaction_amount)  # Precision loss!
})
```

`float(Decimal('10.01'))` is `10.01` — looks fine. But `float(Decimal('0.1') + Decimal('0.2'))` is `0.30000000000000004`. When these floats are passed back to create settlements, rounding errors accumulate.

The `to_representation` method in `ExpenseSerializer` also converts amounts to float:

```python
# serializers.py line 327
ret['amount'] = float(ret['amount'])
```

This should use string serialization for financial amounts, or at minimum use `DRF`'s `DecimalField` with proper coerce settings.

#### Zero-Amount Share Acceptance

`ExpenseShareSerializer.validate` (serializers.py line 44) allows `amount = 0`:

```python
def validate(self, data):
    if data.get('amount'):
        if data['amount'] < 0:
            raise serializers.ValidationError("Amount cannot be negative")
    return data
```

`if data.get('amount')` is falsy for `0`, so zero-amount shares bypass validation entirely. The model validator `MinValueValidator(Decimal('0.01'))` would catch this on save, but the serializer's `create()` method (line 460) can create shares with `amount=0` from `shares_data`:

```python
'amount': share_data.get('amount', 0),  # Default 0 if not provided
```

### 3.2 Authorization Flaws

#### CRITICAL: IDOR in Expense Splitting

`split_equally` (expenses/views.py line 97) accepts arbitrary `user_ids` without validating group membership:

```python
@action(detail=True, methods=['post'])
def split_equally(self, request, pk=None):
    expense = self.get_object()
    user_ids = request.data.get('user_ids', [])
    # NO VALIDATION that user_ids are group members!
    for user_id in user_ids:
        ExpenseShare.objects.create(
            expense=expense,
            user_id=user_id,          # Arbitrary user ID
            amount=share_amount,
            ...
        )
```

An attacker can create expense shares for **any user in the system**, effectively assigning debt to strangers. The same vulnerability exists in `split_by_amount` and `split_by_percentage`.

**Fix:**

```python
if expense.group:
    valid_member_ids = set(
        expense.group.memberships.filter(is_active=True)
        .values_list('user_id', flat=True)
    )
    invalid_ids = set(user_ids) - valid_member_ids
    if invalid_ids:
        return Response(
            {'error': f'Users {invalid_ids} are not group members'},
            status=status.HTTP_400_BAD_REQUEST
        )
```

#### IDOR in Expense Share Settlement

`settle_expense_share` (payments/views.py line 547) fetches any share by ID:

```python
share = ExpenseShare.objects.get(id=share_id)
if user.id not in [share.user_id, share.paid_by_id]:
    return Response({'detail': 'Unauthorized'}, status=403)
```

The authorization check happens **after** the object is fetched. While this prevents modification, the error message differentiates between "not found" (404 for non-existent IDs) and "unauthorized" (403 for existing but unauthorized shares) — this is an **information disclosure** that lets attackers enumerate valid share IDs.

**Fix** — scope the query to the authenticated user:

```python
share = ExpenseShare.objects.filter(
    id=share_id
).filter(
    Q(user=user) | Q(paid_by=user)
).first()

if not share:
    return Response({'detail': 'Not found'}, status=404)
```

#### Debug Information Exposure

`user_balances` (payments/views.py line 269) returns debug data in production:

```python
'debug_info': {
    'user_id': user.id,
    'shares_count': len(share_details),
    'raw_you_owe': float(total_you_owe),
    'raw_owed_to_you': float(total_owed_to_you),
    'net_balances': {k: float(v) for k, v in net_balances.items()},
    'share_details': share_details[:10],
}
```

This leaks internal user IDs, precise balance calculations, and share details. Must be gated behind `DEBUG`:

```python
response_data = {
    'balances': raw_balances,
    'simplified_transactions': transactions_with_names,
    'total_owed': float(total_you_owe),
    'total_owed_to_you': float(total_owed_to_you),
}
if settings.DEBUG:
    response_data['debug_info'] = {...}
```

#### Unprotected Bulk Settlement

`settle_all` (groups/views.py line 394) lets a group admin mark ALL expenses as settled, but it doesn't create `Settlement` records, doesn't update `ExpenseShare.is_settled`, and doesn't notify affected members. A malicious admin can wipe all debts with no audit trail.

#### No Rate Limiting on Reminders

`send_reminder` (payments/views.py line 606) has no rate limit. A user can spam another user with unlimited payment reminders. Add per-user throttling:

```python
from rest_framework.throttling import UserRateThrottle

class ReminderRateThrottle(UserRateThrottle):
    rate = '5/hour'
```

#### JWT Token in SessionStorage

Tokens stored in `sessionStorage` are accessible to any JavaScript running on the same origin. An XSS vulnerability anywhere in the app gives full account takeover. While the app uses DOMPurify for sanitization, the `ExpenseComment.comment` field has no server-side HTML sanitization — comments are stored raw and could contain payloads that bypass client-side sanitization on other clients.

### 3.3 Data Integrity

#### Orphaned Records on Cascade Delete

`Expense.group` is `on_delete=CASCADE` — deleting a group deletes all its expenses. But `ExpenseShare` records reference `User` (also `CASCADE`). Deleting a user deletes their shares, which corrupts the expense totals for everyone else in the group.

The `paid_by` field on `Expense` is also `CASCADE` — deleting the payer deletes the entire expense, including everyone else's shares. This should be `PROTECT` or `SET_NULL`.

#### No Database Constraints on Financial Invariants

There's no database-level `CHECK` constraint ensuring:
- `ExpenseShare` amounts sum to `Expense.amount`
- `WalletAllocation` amounts sum to `MonthlyBudget.total_amount`
- `Settlement.amount > 0`

Without these, application bugs can create negative settlements, negative shares, or shares that exceed the expense total.

---

## 4. Uncharted UX Gaps & Logical Flaws

### 4.1 Dead-End User Flows

#### Leaving a Group with Unsettled Debts

A user can leave a group (groups/views.py line 185) while still having unsettled `ExpenseShare` records. After leaving:
- Their shares still exist in the database
- The `user_balances` view still shows the debt
- But the user can no longer see the group's expenses to understand what they owe
- The group members can no longer settle with the departed user through the group interface

**Fix:** Block departure while unsettled shares exist, or prompt settlement first.

#### Recurring Expenses with Missing Methods

`RecurringExpenseViewSet.process_all` (views.py line 396) calls `recurring.should_create_expense()` — **this method doesn't exist on the model**. This action will crash at runtime.

`create_next_expense` (views.py line 375) sets `recurring_expense.last_generated` — **this field doesn't exist on the model**. This will also crash.

The `RecurringExpense` model has a working `create_next_expense()` method, but the view doesn't use it — it reimplements the logic (incorrectly).

#### Invitation System Inconsistency

`GroupViewSet.join` (line 125) queries `GroupInvitation` for `invite_code` and `status` fields:

```python
invitation = GroupInvitation.objects.filter(
    invite_code=invite_code,
    status='pending',
    ...
)
```

But the `GroupInvitation` model has neither `invite_code` nor `status` fields. It has `is_accepted`, `is_expired`, and the invite code lives on the `Group` model. This action will raise a `FieldError`.

Meanwhile, `join_by_code` (line 663) correctly uses `Group.invite_code`. The two join flows are contradictory.

### 4.2 Circular Debt Simplification Flaws

The `DebtSimplifier.find_cycles` method (debt_simplifier.py line 78) has a fundamental logic error. It builds a graph from **net balances**, not from individual debts:

```python
for user_id, balance in balances.items():
    if balance > 0:  # This user owes money
        for other_id, other_balance in balances.items():
            if other_id != user_id and other_balance < 0:
                graph[user_id].append(other_id)
```

This creates edges from **every debtor** to **every creditor** — a complete bipartite graph. In a group of 10 people (5 debtors, 5 creditors), this creates 25 edges. The DFS will "find" cycles that don't represent actual debt relationships.

The real problem: `minimize_transactions` calls `find_cycles` but **ignores the result** — it just falls through to `simplify_debts` (the greedy algorithm):

```python
def minimize_transactions(balances):
    cycles = DebtSimplifier.find_cycles(balances)  # Result unused
    simplified = DebtSimplifier.simplify_debts(balances)
    optimized = DebtSimplifier._merge_transactions(simplified)
    return optimized
```

The cycle detection is dead code. The actual simplification uses a greedy creditor-debtor matching approach, which is correct for minimizing transaction count but **doesn't find the optimal solution** in all cases.

For the specific case of circular debt (A owes B $10, B owes C $10, C owes A $10), the net balances are all zero, so `simplify_debts` correctly returns no transactions. But for partial circles (A owes B $10, B owes C $5, C owes A $3), the greedy algorithm may produce suboptimal results.

**For enterprise scale**, implement the min-cost flow algorithm:

```python
import heapq

def minimize_transactions_optimal(balances):
    """Optimal debt simplification using min-cost matching."""
    creditors = []  # max-heap (negate for max)
    debtors = []    # max-heap (negate for max)
    
    for uid, bal in balances.items():
        if bal > Decimal('0.01'):
            heapq.heappush(debtors, (-bal, uid))
        elif bal < Decimal('-0.01'):
            heapq.heappush(creditors, (bal, uid))  # Already negative
    
    transactions = []
    while creditors and debtors:
        credit_amt, creditor = heapq.heappop(creditors)
        debit_amt, debtor = heapq.heappop(debtors)
        
        settle = min(-credit_amt, -debit_amt)
        transactions.append({
            'from': debtor, 'to': creditor,
            'amount': settle
        })
        
        remainder_c = -credit_amt - settle
        remainder_d = -debit_amt - settle
        
        if remainder_c > Decimal('0.01'):
            heapq.heappush(creditors, (-remainder_c, creditor))
        if remainder_d > Decimal('0.01'):
            heapq.heappush(debtors, (-remainder_d, debtor))
    
    return transactions
```

### 4.3 Multi-Currency Blind Spots

The `user_balances` and `group_balances` views aggregate amounts across currencies without conversion:

```python
# payments/views.py lines 173-198
balances[share_paid_by_id]['owed'] += share.amount  # Mixes USD, EUR, GBP...
```

If user A owes B $10 (USD) and B owes A €10 (EUR), the system treats them as the same amount and computes net balance as $0. At current exchange rates ($10 USD ≈ €9.20), someone loses $0.80.

### 4.4 Soft Delete Inconsistency

`Expense` has soft-delete fields (`is_deleted`, `deleted_at`, `deleted_by`) but `perform_destroy` (views.py line 56) does a **hard delete**:

```python
def perform_destroy(self, instance):
    group = instance.group
    instance.delete()  # Hard delete, ignoring soft-delete fields
```

And no queryset filter excludes soft-deleted records:

```python
# ExpenseFilterMixin should include:
queryset = queryset.filter(is_deleted=False)
```

### 4.5 Hardcoded Monthly Budget

Dashboard.tsx line 374:

```typescript
monthlyBudget: 3000, // TODO: Get from user settings
```

The entire budget progress bar, alerts, and percentage calculations are based on a magic number. The budget module exists with `MonthlyBudget`, `WalletAllocation` models — but the dashboard doesn't query them.

---

## 5. The "Level-Up" Roadmap

### 5.1 Event-Driven Architecture

#### Where to Introduce Celery/Redis

| Operation | Current Behavior | Should Be Async |
|---|---|---|
| Notification creation | Synchronous inline calls in views | Celery task — don't block the HTTP response |
| Email/SMS sending | Not implemented (TODO) | Celery task with retries |
| Analytics aggregation | Computed on every request | Pre-computed via periodic Celery beat |
| Receipt OCR processing | Not implemented | Celery task — potentially 5-30s per image |
| Currency rate updates | Celery beat reference exists, task doesn't | Implement the task |
| Report generation (CSV/PDF) | Synchronous in view | Celery task with file storage + download link |
| Debt simplification for large groups | Synchronous per request | Cache result, invalidate on expense change |

The scheduled tasks referenced in `celery.py` but **never implemented**:

```python
# These task modules don't exist yet:
'apps.notifications.tasks.send_expense_reminders'
'apps.core.tasks.update_currency_rates'
'apps.notifications.tasks.cleanup_old_notifications'
```

Implementation blueprint for the most critical task:

```python
# apps/notifications/tasks.py
from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_expense_notification(self, user_id, notification_type, title, message, metadata=None):
    """Async notification dispatch with retry logic."""
    try:
        from .services import NotificationService
        user = User.objects.get(id=user_id)
        notification = NotificationService.create_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {},
        )
        
        # Dispatch to channels (email, push, SMS) based on user preferences
        preferences = user.notificationpreference_set.filter(
            notification_type=notification_type, is_enabled=True
        )
        for pref in preferences:
            if 'email' in pref.delivery_methods:
                send_email_notification.delay(notification.id)
            if 'push' in pref.delivery_methods:
                send_push_notification.delay(notification.id)
        
        return notification.id
    except Exception as exc:
        self.retry(exc=exc)


@shared_task
def recalculate_group_analytics(group_id):
    """Periodic analytics pre-computation."""
    from apps.analytics.models import ExpenseAnalytics
    from apps.expenses.models import Expense
    from django.db.models import Sum, Count, Avg
    from django.utils import timezone
    from datetime import timedelta
    
    for period_type, days in [('weekly', 7), ('monthly', 30), ('quarterly', 90)]:
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        stats = Expense.objects.filter(
            group_id=group_id,
            expense_date__range=(start_date, end_date)
        ).aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount'),
        )
        
        ExpenseAnalytics.objects.update_or_create(
            group_id=group_id,
            period_type=period_type,
            period_start=start_date,
            defaults={
                'period_end': end_date,
                'total_amount': stats['total'] or 0,
                'expense_count': stats['count'] or 0,
                'average_amount': stats['avg'] or 0,
            }
        )
```

### 5.2 Real-Time Capabilities

#### Django Channels for Live Updates

When user A adds a $50 dinner expense to a group, users B, C, and D should see it **instantly** — not on next page refresh.

Architecture:

```
Client (WebSocket) → Django Channels → Channel Layer (Redis) → Group Broadcast
```

Implementation blueprint:

```python
# apps/notifications/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.user_group = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        
        unread = await self.get_unread_count()
        await self.send_json({'type': 'unread_count', 'count': unread})
    
    async def disconnect(self, code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
    
    async def notification_event(self, event):
        await self.send_json(event['data'])
    
    @database_sync_to_async
    def get_unread_count(self):
        from .models import Notification
        return Notification.objects.filter(
            user=self.user, is_read=False
        ).count()


# Usage in expense creation (service layer):
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_expense_created(expense, group_members):
    channel_layer = get_channel_layer()
    for member in group_members:
        if member.id != expense.paid_by_id:
            async_to_sync(channel_layer.group_send)(
                f'notifications_{member.id}',
                {
                    'type': 'notification_event',
                    'data': {
                        'type': 'expense_added',
                        'expense_id': str(expense.id),
                        'title': expense.title,
                        'amount': str(expense.amount),
                        'paid_by': expense.paid_by.get_full_name(),
                        'group': expense.group.name,
                    }
                }
            )
```

Frontend integration:

```typescript
// hooks/useWebSocket.ts
export function useNotificationSocket() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (!user) return;
    
    const token = tokenStorage.getAccessToken();
    const ws = new WebSocket(
      `${WS_URL}/ws/notifications/?token=${token}`
    );
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'expense_added':
          dispatch(fetchExpenses({}));  // Refetch expenses
          showToast(`${data.paid_by} added "${data.title}" ($${data.amount})`);
          break;
        case 'settlement_completed':
          dispatch(fetchBalances());
          break;
        case 'unread_count':
          dispatch(setUnreadCount(data.count));
          break;
      }
    };
    
    return () => ws.close();
  }, [user]);
}
```

### 5.3 Advanced Analytics & Predictive Insights

#### Data Points to Track

The `UserSpendingPattern` model already has fields for this but is never populated. Key metrics to compute:

**1. Spending Velocity Index**
```python
# Track rolling 7-day spending vs. 30-day average
weekly_spend = expenses_last_7_days.aggregate(Sum('amount'))['amount__sum']
monthly_avg_weekly = expenses_last_30_days.aggregate(Sum('amount'))['amount__sum'] / 4
velocity = weekly_spend / monthly_avg_weekly if monthly_avg_weekly else 0
# velocity > 1.3 = "spending faster than usual"
```

**2. Category Drift Detection**
```python
# Compare this month's category distribution vs. 3-month average
current_dist = get_category_distribution(user, last_30_days)
historical_dist = get_category_distribution(user, last_90_days)
for category, current_pct in current_dist.items():
    historical_pct = historical_dist.get(category, 0)
    if current_pct > historical_pct * 1.5:
        alert(f"Spending on {category} is 50%+ above your average")
```

**3. Recurring Expense Detection**
```python
# Auto-detect recurring patterns from expense history
from collections import Counter

def detect_recurring_patterns(user, lookback_days=90):
    expenses = Expense.objects.filter(
        paid_by=user,
        expense_date__gte=now - timedelta(days=lookback_days)
    ).values('title', 'amount', 'vendor', 'expense_date')
    
    # Group by (rounded_amount, vendor/title) and find regular intervals
    candidates = defaultdict(list)
    for e in expenses:
        key = (round(float(e['amount']), 0), e['vendor'] or e['title'])
        candidates[key].append(e['expense_date'])
    
    patterns = []
    for (amount, name), dates in candidates.items():
        if len(dates) >= 3:
            intervals = sorted([
                (dates[i+1] - dates[i]).days 
                for i in range(len(dates)-1)
            ])
            median_interval = intervals[len(intervals)//2]
            if 25 <= median_interval <= 35:
                patterns.append({
                    'name': name, 'amount': amount,
                    'frequency': 'monthly', 'confidence': 0.9
                })
            elif 6 <= median_interval <= 8:
                patterns.append({
                    'name': name, 'amount': amount,
                    'frequency': 'weekly', 'confidence': 0.85
                })
    return patterns
```

**4. Budget Forecast**
```python
# Linear regression on daily spend to predict month-end total
import numpy as np

def forecast_monthly_total(user, year, month):
    expenses = Expense.objects.filter(
        paid_by=user,
        expense_date__year=year,
        expense_date__month=month
    ).values('expense_date').annotate(daily=Sum('amount')).order_by('expense_date')
    
    if len(expenses) < 7:
        return None  # Not enough data
    
    days = np.array([e['expense_date'].day for e in expenses])
    amounts = np.cumsum([float(e['daily']) for e in expenses])
    
    # Simple linear extrapolation
    slope = np.polyfit(days, amounts, 1)[0]
    days_in_month = calendar.monthrange(year, month)[1]
    predicted_total = slope * days_in_month
    
    return {
        'current_total': float(amounts[-1]),
        'predicted_total': float(predicted_total),
        'confidence_interval': (predicted_total * 0.85, predicted_total * 1.15),
        'days_remaining': days_in_month - int(days[-1]),
    }
```

**5. Group Fairness Score**
```python
# Detect if one person always pays and others never settle
def group_fairness_score(group_id):
    shares = ExpenseShare.objects.filter(
        expense__group_id=group_id
    ).values('user_id', 'paid_by_id', 'amount', 'is_settled')
    
    user_stats = defaultdict(lambda: {'paid': Decimal(0), 'owed': Decimal(0), 'settled_ratio': 0})
    for share in shares:
        if share['user_id'] != share['paid_by_id']:
            user_stats[share['paid_by_id']]['paid'] += share['amount']
            user_stats[share['user_id']]['owed'] += share['amount']
            if share['is_settled']:
                user_stats[share['user_id']]['settled_ratio'] += 1
    
    # Gini coefficient of payment burden
    paid_amounts = [float(s['paid']) for s in user_stats.values()]
    if sum(paid_amounts) == 0:
        return 1.0  # Perfect equality (no expenses)
    gini = calculate_gini(paid_amounts)
    return 1.0 - gini  # 1.0 = perfectly fair, 0.0 = one person pays everything
```

---

## 6. Prioritized Action Plan

### Phase 0 — Stop the Bleeding (Week 1-2)

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Fix SQLite → PostgreSQL config with `dj_database_url` | **CRITICAL** | 1 hour |
| 2 | Add `select_for_update()` to settlement flows | **CRITICAL** | 4 hours |
| 3 | Fix IDOR in `split_equally/by_amount/by_percentage` — validate group membership | **CRITICAL** | 2 hours |
| 4 | Remove `debug_info` from `user_balances` response | **HIGH** | 15 min |
| 5 | Fix `settle_all` to also update `ExpenseShare.is_settled` | **HIGH** | 1 hour |
| 6 | Fix broken views: `GroupViewSet.statistics` (wrong field name), `GroupInvitation` join (missing fields), `RecurringExpense.process_all` (missing method) | **HIGH** | 4 hours |
| 7 | Fix token storage inconsistency (sessionStorage vs localStorage) | **HIGH** | 30 min |
| 8 | Fix equal split rounding — assign remainder to one share | **HIGH** | 2 hours |
| 9 | Add `filter(is_deleted=False)` to expense querysets | **MEDIUM** | 1 hour |
| 10 | Fix hardcoded 'USD' currency in balance views | **MEDIUM** | 2 hours |

### Phase 1 — Foundation (Week 3-6)

| # | Task | Impact |
|---|---|---|
| 1 | Create `/api/dashboard/` aggregated endpoint (replace 5 frontend calls) | Performance |
| 2 | Add lightweight list serializers vs. full detail serializers | Performance |
| 3 | Fix all N+1 queries (batch user lookups, single-query daily trends) | Performance |
| 4 | Implement the missing Celery tasks | Reliability |
| 5 | Add GitHub Actions CI pipeline (tests, linting, security scan) | Reliability |
| 6 | Migrate from AppContext to Redux (or RTK Query) everywhere | Maintainability |
| 7 | Add `pre-commit` hooks (black, isort, flake8, mypy) | Code Quality |
| 8 | Write integration tests for settlement flows with concurrency | Reliability |

### Phase 2 — Scale (Week 7-12)

| # | Task | Impact |
|---|---|---|
| 1 | Introduce RTK Query or React Query for frontend data fetching | Performance + UX |
| 2 | Move all notification sends to Celery tasks | Performance |
| 3 | Add Django Channels for real-time notifications | UX |
| 4 | Add PostgreSQL partial indexes for hot query paths | Performance |
| 5 | Implement proper multi-currency support with conversion rates | Correctness |
| 6 | Pre-compute analytics via Celery beat into `ExpenseAnalytics` | Performance |
| 7 | Add Redis caching for balance calculations (invalidate on expense/settlement change) | Performance |
| 8 | Docker: fix nginx.conf, fix port mapping, add health check dependencies | DevOps |

### Phase 3 — Enterprise (Week 13-20)

| # | Task | Impact |
|---|---|---|
| 1 | Implement predictive analytics (spending forecast, anomaly detection) | Product |
| 2 | Add OCR receipt processing via Celery | Product |
| 3 | Add comprehensive audit logging with `ActivityLog` | Compliance |
| 4 | Implement row-level security policies in PostgreSQL | Security |
| 5 | Add API versioning (`/api/v1/`, `/api/v2/`) | Maintainability |
| 6 | Horizontal scaling: separate read replicas for analytics queries | Scale |
| 7 | Add Kubernetes manifests / Helm charts for production deployment | DevOps |
| 8 | Load test with Locust/k6 targeting 100k concurrent users | Validation |

---

## Appendix: File Reference

| Finding | File | Line(s) |
|---|---|---|
| SQLite hardcoded | `backend/config/settings.py` | 111-116 |
| N+1 in user_balances | `backend/apps/payments/views.py` | 219, 250-251 |
| N+1 in dashboard_stats | `backend/apps/analytics/views.py` | 86-97 |
| IDOR in split_equally | `backend/apps/expenses/views.py` | 97-125 |
| Settlement race condition | `backend/apps/payments/views.py` | 547-579 |
| Rounding error in equal split | `backend/apps/expenses/models.py` | 226-240 |
| Decimal→float conversion | `backend/apps/payments/debt_simplifier.py` | 63, 224 |
| Dead cycle detection code | `backend/apps/payments/debt_simplifier.py` | 78-151 |
| Debug info exposure | `backend/apps/payments/views.py` | 269-277 |
| Token storage mismatch | `frontend/src/utils/storage.ts` vs `frontend/src/store/slices/authSlice.ts` | — |
| Dual state management | `frontend/src/context/AppContext.tsx` vs `frontend/src/store/` | — |
| Hardcoded budget | `frontend/src/pages/Dashboard.tsx` | 374 |
| Missing Celery tasks | `backend/config/celery.py` | Beat schedule |
| Broken GroupInvitation.join | `backend/apps/groups/views.py` | 125-183 |
| settle_all doesn't update shares | `backend/apps/groups/views.py` | 394-430 |
| Missing nginx.conf | `frontend/Dockerfile` | References non-existent file |
| Port mismatch in Docker | `docker-compose.yml` + `frontend/Dockerfile` | — |

---

*This report was generated from static analysis of the complete codebase. Runtime profiling under load would likely reveal additional bottlenecks not visible in code review.*
