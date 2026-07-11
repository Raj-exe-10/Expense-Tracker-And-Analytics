# Do not

- Do not invent backend endpoints or frontend API URLs that are not registered.
- Do not break the three-shell routing model or bypass `AuthGuard` / `AdminGuard`.
- Do not commit secrets, `.env` with real credentials, or API keys.
- Do not duplicate HTTP logic outside `frontend/src/services/api.ts` modules.
- Do not treat `docs/archive/*` or aspirational sections as source of truth over code.
- Do not assume OCR, Stripe/PayPal, or WebSockets are live — check `docs/feature-status.md` first.
- Do not claim a task done without [verification.md](verification.md) for non-trivial code edits.
- Do not ask Bugbot/Security subagents to edit files — main agent applies fixes.
- Do not expand scope to “fix the whole audit” unless the user asks.
- On landing pages: do not use generic purple-gradient or warm-cream-serif AI default looks; follow existing landing tokens.
- Do not expose writable `role` / `is_verified` / `is_premium` on user APIs.
- Do not look up expenses for sync by bare ID without ownership/membership scoping.
- Do not set `CORS_ALLOW_ALL_ORIGINS` from `DEBUG`, or leave OpenAPI docs public in production.
- Do not store JWTs in IndexedDB offline queues, or re-POST pending expenses after a successful batch sync.
- Do not remove `rest_framework_simplejwt.token_blacklist` from `INSTALLED_APPS` without a replacement logout strategy.
- Do not mass-settle all personal `ExpenseShare` rows when `settlement.group` is null.
