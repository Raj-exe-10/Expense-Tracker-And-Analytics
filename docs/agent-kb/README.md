# Agent knowledge base (LedgerCore)

Curated, code-accurate reference for AI agents. Prefer these files over the longer human docs in `docs/` unless the user asks for full guides.

**SDD pipeline** (Cursor ↔ OpenCode parity): see [`AGENTS.md`](../../AGENTS.md) — skill `feature-workflow`, Spec Kit under `.opencode/skills/speckit-*` (mirrored to `.cursor/skills/speckit-*`), graphify before explore, Superpowers during implement, `verify-and-fix` before done. Constitution: [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).

| File | Use when |
|------|----------|
| [architecture.md](architecture.md) | Orienting on stack, apps, shells |
| [domain-glossary.md](domain-glossary.md) | Naming (Squad vs Group, wallets, etc.) |
| [api-map.md](api-map.md) | Adding or calling APIs |
| [auth-and-roles.md](auth-and-roles.md) | Login, JWT, roles |
| [permissions.md](permissions.md) | Who can call what; queryset scoping |
| [frontend-map.md](frontend-map.md) | Routes, shells, Redux, themes |
| [budget-envelopes.md](budget-envelopes.md) | Envelope budgeting |
| [settlements.md](settlements.md) | Balances, settle, debt simplify |
| [offline-sync.md](offline-sync.md) | Expense sync / conflicts |
| [testing.md](testing.md) | Writing and running tests |
| [verification.md](verification.md) | Compile/check/review before done |
| [known-pitfalls.md](known-pitfalls.md) | Common agent mistakes |
| [do-not.md](do-not.md) | Hard constraints |
| [runbook.md](runbook.md) | Local start, migrate, env |

## Human docs (diagrams)

Prefer current human docs over archive:

- Index: `docs/README.md`
- Architecture / frontend / data-model / flows / api-overview
- `docs/feature-status.md`, `docs/glossary.md`

Historical only: `docs/archive/` (old Developer Guide, API catalog, audits).
