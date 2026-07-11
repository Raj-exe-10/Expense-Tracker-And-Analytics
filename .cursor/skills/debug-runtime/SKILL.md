---
name: debug-runtime
description: >-
  Diagnose LedgerCore runtime and API failures using SystemLog, API logging
  middleware, appLogger, and the correct SPA shell. Use when requests fail,
  UI shows errors, auth loops, or the user reports a bug to investigate.
---

# Debug runtime

## Steps

1. Reproduce in the right zone (`/app`, `/search`, `/admin`) with the right role.
2. Browser: Network tab status/body; console for `appLogger` (`frontend/src/utils/appLogger.ts`).
3. Backend terminal: Django `runserver` traceback.
4. Persisted logs: `SystemLog` / admin **System Logs** page (`/admin/logs`) — middleware `APILoggingMiddleware`.
5. Auth issues: trace `authSession.ts` refresh + token storage; confirm `/api/auth/token/refresh/`.
6. 403/empty lists: check queryset scoping and group membership (not only “API down”).
7. Sync issues: read `docs/agent-kb/offline-sync.md` and conflict payloads.

## Fix

Apply minimal fix → `write-tests` if behavior was wrong → `verify-and-fix`.
