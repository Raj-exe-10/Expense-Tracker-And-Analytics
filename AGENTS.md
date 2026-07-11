# AGENTS.md — LedgerCore (Expense Tracker & Analytics)

Guidance for AI agents working in this repository.

## Product

- **Brand (UI):** LedgerCore  
- **Stack:** Django 4.2 + DRF + SimpleJWT | React 18 + TypeScript + MUI + Redux Toolkit  
- **Monorepo:** `backend/` (API), `frontend/` (SPA), `docs/` (human docs), `docs/agent-kb/` (agent docs)

## Read first

1. [`docs/agent-kb/README.md`](docs/agent-kb/README.md) — index  
2. [`docs/agent-kb/architecture.md`](docs/agent-kb/architecture.md) + [`known-pitfalls.md`](docs/agent-kb/known-pitfalls.md)  
3. Prefer **agent-kb** for agent work. For diagrams use `docs/README.md`. Treat `docs/archive/` as historical only.

## UI zones

| Path | Shell | Notes |
|------|-------|-------|
| `/app/*` | PersonalShell | Main product |
| `/search/*` | SearchShell | Search/enterprise UX |
| `/admin/*` | AdminShell | `admin` / `enterprise_admin` only |
| `/` | Landing | Marketing; tokens in `landingTokens.ts` |

**Squad (UI) = Group (API).** Use `groupsAPI` / `/api/groups/`.

## Key paths

- API root: `backend/config/urls.py`  
- Client APIs: `frontend/src/services/api.ts`  
- Routes: `frontend/src/routes/AppRoutes.tsx`  
- Auth refresh: `frontend/src/services/authSession.ts`  
- Cursor rules: `.cursor/rules/`  
- Cursor skills: `.cursor/skills/`

## Hard policies

1. **Verify before done** — After non-trivial code changes, follow skill `verify-and-fix` ([docs/agent-kb/verification.md](docs/agent-kb/verification.md)). Do not claim done until scoped compile/checks/tests pass and blocking review findings are fixed.
2. **Tests for new behavior** — Follow skill `write-tests` ([docs/agent-kb/testing.md](docs/agent-kb/testing.md)) for new/changed API, domain logic, sync, or auth.
3. **No invented APIs** — Extend existing app urls + `*API` modules.
4. **Permissions** — Every endpoint: who can call it, what queryset ([permissions.md](docs/agent-kb/permissions.md)).
5. **Secrets** — Never commit real `.env` credentials.
6. **Track changes** — After any meaningful development or modification, append an entry to [`docs/tracker.md`](docs/tracker.md) (date heading, tag, note, areas, commit hash or `uncommitted`). When committing later, fill in the hash.

## Skills to use

| Skill | When |
|-------|------|
| `expense-tracker-dev` | General feature work in this repo |
| `add-api-endpoint` | New/changed REST endpoints |
| `add-app-page` | New SPA pages/routes |
| `write-tests` | New behavior needs tests |
| `verify-and-fix` | Before marking a coding task done |
| `debug-runtime` | Runtime/API failures |
| `django-migrate` | Model/schema changes |
| `offline-sync` | Expense sync / conflicts |
