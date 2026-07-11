---
name: expense-tracker-dev
description: >-
  Navigate and change the LedgerCore expense tracker monorepo (Django REST +
  React). Use when working on expenses, groups/squads, budget envelopes,
  settlements, analytics, admin, auth, or general feature work in this project.
---

# Expense Tracker / LedgerCore development

## Before coding

1. Read `docs/agent-kb/architecture.md` and `docs/agent-kb/known-pitfalls.md`.
2. Pick domain docs: API → `api-map.md`; auth → `auth-and-roles.md`; UI → `frontend-map.md`; budget/settlements/sync as needed.
3. Confirm shell/zone (`/app`, `/search`, `/admin`) and existing `*API` module.

## Checklist

- [ ] Correct Django app / frontend folder
- [ ] No invented endpoints — extend app urls + `api.ts`
- [ ] Permissions + queryset answered (`permissions.md`)
- [ ] Squad = Group naming respected
- [ ] New behavior → skill `write-tests`
- [ ] Finish with skill `verify-and-fix`
- [ ] Append entry to `docs/tracker.md` for this change (tag, note, areas, commit or uncommitted)

## Pointers

- Backend apps: `backend/apps/`
- Routes: `frontend/src/routes/AppRoutes.tsx`
- Client: `frontend/src/services/api.ts`
- Do-not list: `docs/agent-kb/do-not.md`
- Human docs index (diagrams): `docs/README.md`
- Development log: `docs/tracker.md` (append on meaningful changes)
- Feature live vs stub: `docs/feature-status.md`
- Glossary: `docs/glossary.md` (or agent-kb `domain-glossary.md`)
- Archived megadocs only: `docs/archive/` (not source of truth)
