# Settlements

## Models

- **Settlement** (`payments.Settlement`) — payer/payee, amount, status lifecycle (pending → completed/failed, confirmations).
- Related: `PaymentMethod`, `Payment`, `PaymentRequest`, webhooks.

## Logic

- Debt simplification: `backend/apps/payments/debt_simplifier.py` (`simplify_debts`, cycles, minimize transactions).
- Balances and quick-settle live under `/api/payments/` (see app `urls.py` / viewsets).
- **Create:** always `payer=request.user` (ignore client `payer_id`).
- **`mark_as_completed`:**
  - Explicit `_settle_share_ids` → settle those shares only.
  - With `group` → settle unsettled shares in that group between payer/payee.
  - Personal (no group) → settle non-group shares **up to settlement amount** (FIFO by `created_at`), not all shares.
- **PaymentRequest.approve / dispute:** `transaction.atomic()` + `select_for_update()`; UI must disable while in flight.

## Frontend

- Pages: `Settlements.tsx`, `SettlementReportsPage.tsx` under `/app/settlements`.
- Client: `settlementsAPI`, `paymentRequestsAPI`, `settlementReportsAPI`.
- Disable settle/approve buttons while submitting.

## Agent rules

- Settlements affect balances — cover auth + wrong-party denial in tests.
- Prefer existing quick-settle / balances endpoints over inventing parallel math on the client.
- Treat payments/settlements as **sensitive** for Security Review in verify-and-fix.
- Never reintroduce `expense__group=None` as a wildcard that clears all personal shares.
