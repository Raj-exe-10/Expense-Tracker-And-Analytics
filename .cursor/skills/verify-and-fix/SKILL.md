---
name: verify-and-fix
description: >-
  After implementing LedgerCore code changes, run compile/typecheck/tests and
  parallel Bugbot/Security review, then fix blocking issues. Use before claiming
  done, or when the user mentions verify, QA, compile errors, or review-and-fix.
---

# Verify and fix

Main agent implements and **fixes**. Review subagents stay **readonly**.

## Loop (max 3)

1. Scope changes (frontend / backend / both) via git status or edited paths.
2. If behavior changed without tests, run skill `write-tests` first.
3. **One parallel batch:**
   - Shell checks from `docs/agent-kb/verification.md` (tsc, `manage.py check`, relevant pytest/Jest).
   - One Task `bugbot` (`readonly: true`, `run_in_background: false`) with:

```text
Full Repository Path: <repo root absolute path>
Diff: uncommitted changes
```

   - If auth/payments/admin/sync/uploads or user asked: one Task `security-review` same Diff shape.
4. Merge findings; fix **Must fix** items (compile, failed tests, Critical/High).
5. Re-run the batch until clean or hit the cap; then report leftovers.

## Project override

Built-in Bugbot/Security skills say not to fix unless asked. For LedgerCore coding tasks, **do fix** blocking findings unless the user said review-only.

## Report format

See [examples.md](examples.md).
