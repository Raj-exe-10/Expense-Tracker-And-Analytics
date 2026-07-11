# Settlements

## Models

- **Settlement** (`payments.Settlement`) — payer/payee, amount, status lifecycle (pending → completed/failed, confirmations).
- Related: `PaymentMethod`, `Payment`, `PaymentRequest`, webhooks.

## Logic

- Debt simplification: `backend/apps/payments/debt_simplifier.py` (`simplify_debts`, cycles, minimize transactions).
- Balances and quick-settle live under `/api/payments/` (see app `urls.py` / viewsets).

## Frontend

- Pages: `Settlements.tsx`, `SettlementReportsPage.tsx` under `/app/settlements`.
- Client: `settlementsAPI`, `paymentRequestsAPI`, `settlementReportsAPI`.

## Agent rules

- Settlements affect balances — cover auth + wrong-party denial in tests.
- Prefer existing quick-settle / balances endpoints over inventing parallel math on the client.
- Treat payments/settlements as **sensitive** for Security Review in verify-and-fix.
