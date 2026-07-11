# API map

Root include: [`backend/config/urls.py`](../../backend/config/urls.py).

| Prefix | App urls | Client module (`frontend/src/services/api.ts`) |
|--------|----------|-----------------------------------------------|
| `/api/auth/` | `authentication.urls` | `authAPI`, `securityAPI` |
| `/api/expenses/` | `expenses.urls` (+ sync) | `expensesAPI`, `syncAPI` |
| `/api/groups/` | `groups.urls` | `groupsAPI` |
| `/api/payments/` | `payments.urls` | `settlementsAPI`, `paymentRequestsAPI`, `settlementReportsAPI` |
| `/api/analytics/` | `analytics.urls` | `analyticsAPI` |
| `/api/notifications/` | `notifications.urls` | `notificationsAPI` |
| `/api/core/` | `core.urls` | `coreAPI`, `systemLogsAPI` |
| `/api/budget/` | `budget.urls` | `budgetAPI`, `fixedCostsAPI` |
| `/api/dashboard/` | `core.dashboard_urls` | `dashboardAPI` |
| `/api/enterprise/` | `enterprise.urls` | `enterpriseAPI` |

Docs UI: `/api/docs/`, `/api/redoc/`, schema `/api/schema/`.

## Patterns

- CRUD: DRF `ModelViewSet` + `DefaultRouter` inside each app’s `urls.py`.
- Aggregates: function-based views (especially analytics).
- Default permission: authenticated; always confirm per-view.
- Pagination: page size 20 (settings).

## Adding an endpoint

1. Implement in the owning app (serializer/view).
2. Register on that app’s router or `urlpatterns`.
3. Only touch `config/urls.py` if adding a **new** top-level prefix.
4. Mirror in the matching `*API` object in `api.ts`.
5. Follow [permissions.md](permissions.md) and [testing.md](testing.md).
6. Check [feature-status.md](../../feature-status.md) so you do not treat stub capabilities (OCR, live Stripe/PayPal, WebSockets) as live APIs.
