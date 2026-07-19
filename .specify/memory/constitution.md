# LedgerCore Constitution

Governing principles for Spec-Driven Development in the LedgerCore (Expense Tracker & Analytics) monorepo. Spec Kit artifacts and agent work must comply with this document. Domain detail lives in `docs/agent-kb/`; this constitution is the binding summary.

## Core Principles

### I. Spec-First, Then Minimal Diff (NON-NEGOTIABLE for non-trivial work)

Non-trivial features and product changes go through Spec Kit (specify → plan → tasks) before implementation. Obvious bugfixes, one-liner UI tweaks, and docs-only edits may bypass Spec Kit.

During implementation: YAGNI, reuse existing helpers/patterns, prefer standard library and already-installed dependencies, shortest clear working form. No unrequested abstractions, boilerplate, or new dependencies when avoidable. Deletion over addition. Understand the problem and trace the real flow before choosing a minimal change — the smallest wrong-place change is a second bug.

### II. Graphify Before Explore; Update After Code

When `graphify-out/graph.json` exists, orient with `graphify query`, `graphify path`, or `graphify explain` before Read/Grep/Glob exploration. Use `docs/agent-kb/` for durable domain truth. After modifying application code, run `graphify update .` (AST-only). Dirty graphify-out files after incremental updates are expected and are not a reason to skip graphify.

### III. No Invented APIs

Extend existing Django app `urls` and the matching `*API` modules in `frontend/src/services/api.ts`. Do not invent backend endpoints or frontend API URLs. Do not duplicate HTTP outside those modules. Check `docs/feature-status.md` before assuming OCR, Stripe/PayPal, WebSockets, or other aspirational features are live.

### IV. Permissions and Trust Boundaries

Every endpoint answers: who can call it, and what queryset they see (`docs/agent-kb/permissions.md`). Include cross-user denial. Validate at trust boundaries; never expose writable privilege fields (`role`, `is_verified`, `is_premium`) on user APIs. Sensitive domains (auth, sync, settlements, payments, admin, uploads) require Security Review during verification.

### V. Tests and Verify Before Done (NON-NEGOTIABLE)

New or changed API, domain logic, sync, or auth behavior needs focused tests (`write-tests` / `docs/agent-kb/testing.md`). Non-trivial code changes finish with `verify-and-fix` (`docs/agent-kb/verification.md`): scoped compile/checks/tests, Bugbot, and Security Review where required. Do not claim done until blocking findings are fixed or reported. Append meaningful work to `docs/tracker.md`.

### VI. Product Shape: Shells, Squads, Brand

Three SPA zones: `/app` PersonalShell, `/search` SearchShell, `/admin` AdminShell (admin roles only). Do not break shell routing or bypass `AuthGuard` / `AdminGuard`. User-facing **Squad** = backend **Group** (`groupsAPI` / `/api/groups/`). UI brand is LedgerCore. Prefer agent-kb over `docs/archive/`.

### VII. Secrets and Safety

Never commit real `.env` credentials, API keys, or secrets. Do not store JWTs in IndexedDB offline queues. Do not set `CORS_ALLOW_ALL_ORIGINS` from `DEBUG` or leave OpenAPI docs public in production. Follow `docs/agent-kb/do-not.md` and `known-pitfalls.md`.

## Stack and Constraints

- Backend: Django 4.2 + DRF + SimpleJWT under `backend/`
- Frontend: React 18 + TypeScript + MUI + Redux Toolkit under `frontend/`
- Agent entry: `AGENTS.md`; Cursor skills under `.cursor/skills/`; OpenCode under `.opencode/skills/`
- Spec Kit home: `.specify/` (templates, scripts, memory); feature specs under `specs/<NNN>-<name>/`

## Development Workflow

1. **Route** via skill `feature-workflow`: full Spec Kit path, short path, or bypass.
2. **Orient** with graphify + agent-kb.
3. **Specify / plan / task** with Spec Kit skills (parity in Cursor and OpenCode).
4. **Implement** with Superpowers (TDD, plan execution, review) plus LedgerCore domain skills (`expense-tracker-dev`, `add-api-endpoint`, `add-app-page`, `offline-sync`, etc.).
5. **Verify** with `verify-and-fix`, update graphify, append `docs/tracker.md`.

## Governance

- This constitution supersedes ad-hoc agent improvisation for Spec Kit work. Conflict with `docs/agent-kb/` or hard policies in `AGENTS.md` → prefer the more specific agent-kb / policy text and amend this constitution if the principle should change.
- Amendments: update this file, bump version below, note in `docs/tracker.md`.
- Complexity and new dependencies must be justified against Principle I.
- Reviewers and agents verify Spec Kit artifacts and PRs against these principles.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
