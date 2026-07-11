# Stop hook: verify nudge

Prompt-based `stop` hook is configured in `.cursor/hooks.json`.

If the agent edited application code without running `verify-and-fix`, Cursor may inject a one-time follow-up to run verification before the session ends.
