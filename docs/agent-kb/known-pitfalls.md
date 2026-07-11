# Known pitfalls

1. **Squad ≠ new model** — UI “Squad” is `groups.Group` / `groupsAPI`.
2. **Three shells** — put pages under the correct `/app`, `/search`, or `/admin` tree and guard.
3. **Don’t invent API paths** — extend `*API` in `services/api.ts` and existing app urls.
4. **JWT refresh** — use `authSession.ts`; don’t roll a one-off reload-on-401.
5. **Admin SPA vs Django admin** — `/admin/*` SPA needs `admin` / `enterprise_admin`; Django admin is separate.
6. **Expense `version`** — required for offline sync; don’t drop or reset casually.
7. **UUID filters** — validate query params before `.filter(id=...)`.
8. **Empty `tests.py` stubs** — many apps have placeholders; add real tests under `tests/`.
9. **Landing vs app theme** — landing uses `landingTokens.ts`; app uses `ledgerCoreTheme.ts`. Don’t mix purple/cream AI-default palettes into landing.
10. **Stale audit docs** — `docs/archive/CODEBASE_AUDIT_REPORT.md` is historical; re-read code before “fixing” cited lines.
11. **Budget category uniqueness** — a category maps to one wallet per user.
12. **Legacy redirects** — old `/expenses` routes redirect to `/app/...`; prefer new paths in links.
