# Feature status

Status is verified against the **current codebase**, not marketing checklists in older README copy.

| Status | Meaning |
|--------|---------|
| **Live** | Usable end-to-end (API and/or UI) in this repo |
| **Partial** | Models, routes, or UI exist but incomplete / optional / commented |
| **Stub / planned** | Named in old docs or lightly modeled; not a working product path |

| Feature | Status | Evidence |
|---------|--------|----------|
| Individual & group expenses + splits | **Live** | `backend/apps/expenses/`, `/app/expenses`, `expensesAPI` |
| Groups / Squads, invites, membership | **Live** | `backend/apps/groups/`, `/app/people`, `/app/squads/:id` |
| Settlements & balance views | **Live** | `payments.Settlement`, `debt_simplifier.py`, `/app/settlements` |
| Envelope budgeting (wallets, monthly budget) | **Live** | `backend/apps/budget/`, `/app/budget` |
| Fixed costs & savings goals | **Live** | budget models + `budgetAPI` / `fixedCostsAPI` |
| Analytics & post-game | **Live** | `/api/analytics/`, `/app/analytics`, `/app/analytics/post-game` |
| Home dashboard aggregate | **Live** | `/api/dashboard/`, `HomePage` |
| JWT auth (email login, refresh) | **Live** | SimpleJWT, `authSession.ts` |
| TOTP / app-lock PIN | **Live** | `authentication/security_views.py`, `/app/settings/security` |
| Offline expense sync + conflicts | **Live** | `sync_views.py`, `offlineService.ts`, `SyncConflictHost` |
| In-app notifications | **Live** | `notifications` app, `/app/notifications` |
| Admin zone + system logs | **Live** | `/admin/*`, `SystemLog`, `APILoggingMiddleware` |
| Enterprise entities / audit / export jobs | **Live** | `/api/enterprise/`, admin entity pages |
| Recurring expenses | **Live** | `RecurringExpense`, `/app/recurring` |
| Multi-currency fields | **Partial** | `Currency` model + FKs; treat live FX feeds as not guaranteed |
| Receipt attachments | **Partial** | attachment fields on `Expense`; storage local by default |
| Celery background workers | **Partial** | Compose + `config/celery.py`; confirm task coverage per feature |
| AWS S3 media | **Partial** | `storages` installed; S3 block commented in `settings.py` |
| Payment method records | **Partial** | `PaymentMethod` / `Payment` / webhook **models** + method_type choices |
| Stripe / PayPal charge APIs | **Stub / planned** | Env/model hints; no full live SDK checkout flow found |
| OCR receipt scanning | **Stub / planned** | `ocr_data` field; OCR route **commented** in `expenses/urls.py` |
| WebSockets / real-time push | **Stub / planned** | Not in `urls.py`; no Channels consumer app |
| Native mobile app | **Stub / planned** | `UserDevice` model only; no mobile codebase |
| Twilio SMS | **Stub / planned** | Not present in requirements/code paths |
| Prometheus / Grafana / CI workflows | **Stub / planned** | No project Prometheus/Grafana; no `.github/workflows` assumed |

When in doubt, open Swagger at `/api/docs/` and the matching UI route.
