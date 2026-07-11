# LedgerCore documentation

Product UI brand: **LedgerCore**. Repository name: Expense Tracker & Analytics.

## Start here

| Doc | Audience | Contents |
|-----|----------|----------|
| [getting-started.md](getting-started.md) | New developers | Setup, run, migrate, Swagger |
| [architecture.md](architecture.md) | Everyone | System & Docker diagrams, backend apps |
| [frontend.md](frontend.md) | Frontend | Three shells, route map, auth bootstrap |
| [data-model.md](data-model.md) | Backend / data | Mermaid ER diagrams by domain |
| [api-overview.md](api-overview.md) | API consumers | Prefixes, response shape, OpenAPI link |
| [flows.md](flows.md) | Everyone | Sequence diagrams (JWT, sync, settle, logs) |
| [feature-status.md](feature-status.md) | Everyone | **Live vs partial vs stub** capabilities |
| [glossary.md](glossary.md) | Everyone | Squad, wallet, zones, roles, … |
| [tracker.md](tracker.md) | Everyone | Date-wise log of developments and commits |

## Live API reference

Do not use archived hand-written endpoint lists. Use:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Schema: http://localhost:8000/api/schema/

## AI agents

Concise agent guidance: [`agent-kb/`](agent-kb/) and root [`AGENTS.md`](../AGENTS.md). Human docs own diagrams; agent-kb owns short workflows.

## Archived reports

Outdated megadocs live under [`archive/`](archive/) — see [`archive/ARCHIVE_NOTE.md`](archive/ARCHIVE_NOTE.md).
