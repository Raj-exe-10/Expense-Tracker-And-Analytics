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
4. Constitution: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)

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
- OpenCode skills: `.opencode/skills/`  
- Spec Kit home: `.specify/` (templates, scripts, memory); feature specs: `specs/<NNN>-<name>/`

## Hard policies

1. **Verify before done** — After non-trivial code changes, follow skill `verify-and-fix` ([docs/agent-kb/verification.md](docs/agent-kb/verification.md)). Do not claim done until scoped compile/checks/tests pass and blocking review findings are fixed.
2. **Tests for new behavior** — Follow skill `write-tests` ([docs/agent-kb/testing.md](docs/agent-kb/testing.md)) for new/changed API, domain logic, sync, or auth.
3. **No invented APIs** — Extend existing app urls + `*API` modules.
4. **Permissions** — Every endpoint: who can call it, what queryset ([permissions.md](docs/agent-kb/permissions.md)).
5. **Secrets** — Never commit real `.env` credentials.
6. **Track changes** — After any meaningful development or modification, append an entry to [`docs/tracker.md`](docs/tracker.md) (date heading, tag, note, areas, commit hash or `uncommitted`). When committing later, fill in the hash.

## Skills to use

### Router

| Skill | When |
|-------|------|
| `feature-workflow` | New feature / non-trivial change — choose full Spec Kit, short Spec Kit, or bypass |

### LedgerCore domain (Cursor; also follow from OpenCode when coding)

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

### Spec Kit (parity: Cursor + OpenCode)

Skills live under `.opencode/skills/speckit-*/SKILL.md` (**canonical**) and are mirrored to `.cursor/skills/speckit-*/SKILL.md` (no `compatibility: opencode` so Cursor discovers them).

**Maintenance:** Edit Spec Kit skill bodies in `.opencode/skills/speckit-*` first, then copy the same change into `.cursor/skills/speckit-*` in the same PR/change. Do not rely on symlinks (Windows/OneDrive).

| Skill | Role |
|-------|------|
| `speckit-constitution` | Project principles (`.specify/memory/constitution.md`) |
| `speckit-specify` | Requirements / user stories → `specs/<NNN>-<name>/spec.md` |
| `speckit-clarify` | Resolve ambiguities |
| `speckit-plan` | Technical plan + design artifacts |
| `speckit-checklist` | Requirements quality checklists |
| `speckit-tasks` | Actionable `tasks.md` |
| `speckit-analyze` | Cross-artifact consistency |
| `speckit-implement` | Execute tasks |
| `speckit-converge` | Gap check vs codebase |
| `speckit-taskstoissues` | Tasks → GitHub issues |

**Paths:**

- **Full** (default for product features): specify → clarify → plan → checklist → tasks → analyze → implement → converge  
- **Short** (small focused features): specify → plan → tasks → implement → converge  
- **Bypass** (bugfix / one-liner / docs-only): domain skill + graphify + `verify-and-fix`

## Superpowers

[Superpowers](https://github.com/obra/superpowers) supplies TDD, plan execution, subagent review, and branch-finishing skills. **Do not vendor** the Superpowers tree into this repo.

| Agent | Install |
|-------|---------|
| **OpenCode** | Already in [`.opencode/opencode.json`](.opencode/opencode.json): `superpowers@git+https://github.com/obra/superpowers.git` |
| **Cursor** | Install via Cursor plugin marketplace: `obra/superpowers` (user action once per machine) |

During `speckit-implement`: prefer Superpowers for TDD / plan execution / review; prefer LedgerCore skills for domain paths (API, sync, shells, permissions).

## Preferred workflow: graphify → Spec Kit → Superpowers

When the user gives a **feature or non-trivial update** request:

1. Skill `feature-workflow` — pick full / short / bypass  
2. **graphify** `query` / `path` / `explain` — codebase context  
3. **Spec Kit** — specify → (clarify) → plan → (checklist) → tasks → (analyze)  
4. **`speckit-implement`** — Superpowers + LedgerCore domain skills  
5. **`verify-and-fix`** → `graphify update .` → `docs/tracker.md`

Do **not** install a second competing full SDLC skill pack; Spec Kit + Superpowers + LedgerCore skills are enough.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

OpenCode: [`.opencode/plugins/graphify.js`](.opencode/plugins/graphify.js) reminds agents to use the graph. Cursor: always-on [`.cursor/rules/graphify.mdc`](.cursor/rules/graphify.mdc) + [`.cursor/rules/sdd-workflow.mdc`](.cursor/rules/sdd-workflow.mdc).
