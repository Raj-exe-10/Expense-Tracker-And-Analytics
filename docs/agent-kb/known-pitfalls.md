# Known pitfalls

1. **Squad ≠ new model** — UI “Squad” is `groups.Group` / `groupsAPI`. Prefer user-facing label **Squad**.
2. **Three shells** — put pages under the correct `/app`, `/search`, or `/admin` tree and guard.
3. **Don’t invent API paths** — extend `*API` in `services/api.ts` and existing app urls.
4. **JWT refresh** — use `authSession.ts`; don’t roll a one-off reload-on-401. Retry **GET/HEAD/OPTIONS** only after refresh — never blind-retry POST creates.
5. **Admin SPA vs Django admin** — `/admin/*` SPA needs `admin` / `enterprise_admin`; Django admin is separate.
6. **Expense `version`** — exposed read-only on API; required as `base_version` for offline sync updates. Don’t drop or reset casually.
7. **UUID filters** — validate query params before `.filter(id=...)`.
8. **Empty `tests.py` stubs** — many apps have placeholders; add real tests under `tests/`.
9. **Landing vs app theme** — landing uses `landingTokens.ts`; app uses `ledgerCoreTheme.ts`. Don’t mix purple/cream AI-default palettes into landing.
10. **Stale audit docs** — `docs/archive/CODEBASE_AUDIT_REPORT.md` is historical; re-read code before “fixing” cited lines.
11. **Budget category uniqueness** — a category maps to one wallet per user. Always verify `wallet.user == request.user` on writes.
12. **Legacy redirects** — old `/expenses` routes redirect to `/app/...`; prefer new paths in links.
13. **Sync IDOR** — `sync_views` must scope expenses to accessible queryset; bare `Expense.objects.get(id=...)` is forbidden.
14. **User privilege fields** — `role` / `is_verified` / `is_premium` are read-only via API; `UserViewSet` is read-only for non-admins. Never re-open writable role.
15. **Settlements** — force `payer=request.user`; personal `mark_as_completed` settles shares up to amount (FIFO) or explicit `settle_share_ids` — never `expense__group=None` as “all personal shares”.
16. **JWT blacklist** — `rest_framework_simplejwt.token_blacklist` must stay in `INSTALLED_APPS`; run migrate after adding. Logout calls `token.blacklist()`.
17. **CORS** — load origins from env; do not set `CORS_ALLOW_ALL_ORIGINS = DEBUG`.
18. **Offline queue** — one sync path; no token in IndexedDB; absolute API base URL for queued fetches.
