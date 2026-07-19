---
name: feature-workflow
description: >-
  Route LedgerCore feature requests into full Spec Kit, short Spec Kit, or
  bypass paths; always pair with graphify context and finish via verify-and-fix.
  Use when the user asks for a new feature, non-trivial change, or update, or
  when choosing between Spec Kit and a direct domain-skill fix.
---

# Feature workflow (graphify → Spec Kit → Superpowers)

Router for non-trivial product work. Spec Kit skill bodies are canonical under `.opencode/skills/speckit-*` and mirrored under `.cursor/skills/speckit-*`.

## LedgerCore Preflight

1. If `graphify-out/graph.json` exists, run `graphify query "<question>"` (and `path` / `explain` as needed) before Read/Grep/Glob.
2. Skim `docs/agent-kb/` for the domain (architecture, permissions, do-not, known-pitfalls).
3. Honor `.specify/memory/constitution.md`.

## Choose a path

| Path | When | Steps |
|------|------|--------|
| **Bypass Spec Kit** | Obvious bugfix, one-liner UI tweak, docs-only | Domain skill (`expense-tracker-dev`, `debug-runtime`, etc.) → `write-tests` if behavior changes → `verify-and-fix` |
| **Short Spec Kit** | Small focused feature, clear requirements | `speckit-specify` → `speckit-plan` → `speckit-tasks` → `speckit-implement` → `speckit-converge` |
| **Full Spec Kit** | Default for product features / non-trivial changes | `speckit-specify` → `speckit-clarify` → `speckit-plan` → `speckit-checklist` → `speckit-tasks` → `speckit-analyze` → `speckit-implement` → `speckit-converge` |

Constitution (`speckit-constitution`) is maintained when principles change; do not re-run on every feature unless amending `.specify/memory/constitution.md`.

## Implementation layer

During `speckit-implement` (or bypass coding):

- **Superpowers** — TDD, plan execution, subagent review, finishing a branch (Cursor: install `obra/superpowers` from the marketplace; OpenCode: plugin in `.opencode/opencode.json`).
- **LedgerCore skills** — domain authority: `add-api-endpoint`, `add-app-page`, `write-tests`, `offline-sync`, `django-migrate`, `expense-tracker-dev`.

## Done gate

1. Skill `verify-and-fix`
2. `graphify update .` after application code changes
3. Append `docs/tracker.md`

## Do not

- Skip graphify on non-trivial codebase questions when the graph exists.
- Invent APIs or bypass shell/auth guards.
- Add a second competing SDLC skill pack; keep Spec Kit + Superpowers + LedgerCore skills only.
