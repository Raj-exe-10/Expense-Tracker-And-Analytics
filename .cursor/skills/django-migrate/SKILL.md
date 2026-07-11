---
name: django-migrate
description: >-
  Safely change Django models and create migrations for LedgerCore. Use when
  editing models, adding fields, or when migrate/makemigrations is required.
---

# Django migrate

## Steps

1. Edit models in the owning app; keep `UUIDModel` / `TimeStampedModel` / `db_table` conventions.
2. From `backend/`: `python manage.py makemigrations <app>`
3. **Read** the generated migration before applying.
4. `python manage.py migrate`
5. `python manage.py check`
6. Update serializers/admin/tests as needed; run `write-tests` for behavior changes.
7. Finish with `verify-and-fix`.

## Rules

- Do not hand-edit old migrations unless fixing a broken state the user requested.
- Do not delete migration history casually.
- SQLite local vs Postgres: avoid Postgres-only fields without noting deploy impact.
