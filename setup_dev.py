#!/usr/bin/env python3
"""
One-time development setup for the Expense Tracker application.

Run this ONCE before using start.ps1.  It is safe to re-run — every step
is idempotent (skipped when already done).

What it does
------------
1. Creates a Python virtual-environment  (backend/venv)
2. Installs Python dependencies           (backend/requirements.txt)
3. Creates a .env file for local dev      (backend/.env)
4. Runs Django migrations                 (migrate --run-syncdb)
5. Seeds currencies, categories, test users
6. Installs Node/npm dependencies         (frontend/node_modules)
"""

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

IS_WINDOWS = platform.system() == "Windows"
VENV_DIR = BACKEND_DIR / "venv"
if IS_WINDOWS:
    VENV_PYTHON = VENV_DIR / "Scripts" / "python.exe"
    VENV_PIP = VENV_DIR / "Scripts" / "pip.exe"
else:
    VENV_PYTHON = VENV_DIR / "bin" / "python"
    VENV_PIP = VENV_DIR / "bin" / "pip"


# ── Helpers ──────────────────────────────────────────────────────────

def heading(msg: str):
    print(f"\n{'=' * 50}")
    print(f"  {msg}")
    print('=' * 50)


def step(msg: str):
    print(f"\n  -> {msg}")


def run(cmd, cwd=None, check=True, quiet=False):
    """Run a shell command; returns True on success."""
    if not quiet:
        display = cmd if isinstance(cmd, str) else " ".join(cmd)
        print(f"     $ {display}")
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            shell=isinstance(cmd, str),
            capture_output=True,
            text=True,
            check=check,
        )
        if result.stdout and not quiet:
            for line in result.stdout.strip().splitlines():
                print(f"       {line}")
        return True
    except subprocess.CalledProcessError as exc:
        print(f"     ERROR: {exc.stderr.strip() if exc.stderr else exc}")
        if check:
            raise
        return False


def check_prerequisite(name: str, test_cmd: str):
    """Abort early if a required tool is missing."""
    if shutil.which(test_cmd) is None:
        print(f"\n  ERROR: '{name}' is not installed or not on PATH.")
        print(f"         Please install {name} and try again.\n")
        sys.exit(1)


# ── Step functions ───────────────────────────────────────────────────

def check_prerequisites():
    heading("Checking prerequisites")
    check_prerequisite("Python 3", "python")
    check_prerequisite("Node.js", "node")
    check_prerequisite("npm", "npm")
    print("  All prerequisites found.")


def setup_venv():
    heading("Python virtual environment")
    if VENV_PYTHON.exists():
        print(f"  Already exists at {VENV_DIR}")
        return

    step("Creating virtual environment ...")
    run([sys.executable, "-m", "venv", str(VENV_DIR)])
    step("Upgrading pip ...")
    run([str(VENV_PYTHON), "-m", "pip", "install", "--upgrade", "pip", "--quiet"])


def install_python_deps():
    heading("Python dependencies")
    req_file = BACKEND_DIR / "requirements.txt"
    if not req_file.exists():
        print(f"  WARNING: {req_file} not found — skipping.")
        return

    step(f"Installing from {req_file.name} (this may take a minute) ...")
    success = run(
        [str(VENV_PIP), "install", "-r", str(req_file), "--quiet"],
        check=False,
    )
    if not success:
        step("Full install had errors — retrying with core packages only ...")
        core = [
            "Django", "djangorestframework", "django-cors-headers",
            "djangorestframework-simplejwt", "django-environ",
            "dj-database-url", "requests", "Pillow", "whitenoise",
            "openpyxl", "reportlab", "pytz", "django-ratelimit",
            "sentry-sdk", "django-model-utils", "django-extensions",
            "psycopg2-binary", "cryptography", "drf-spectacular",
        ]
        run([str(VENV_PIP), "install", "--quiet"] + core)

    print("  Python dependencies installed.")


def create_env_file():
    heading("Backend .env file")
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        print(f"  Already exists at {env_file}")
        return

    step("Creating .env for local development ...")
    env_file.write_text(
        "DEBUG=True\n"
        "SECRET_KEY=django-insecure-dev-key-change-in-production-8f3k2j5h7g9d1s4a6\n"
        "ALLOWED_HOSTS=localhost,127.0.0.1\n"
        "DATABASE_URL=sqlite:///db.sqlite3\n"
        "REDIS_URL=redis://localhost:6379/0\n"
        "EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend\n",
        encoding="utf-8",
    )
    print("  .env created.")


def run_migrations():
    heading("Django migrations")
    step("Running migrate --run-syncdb ...")
    run(
        [str(VENV_PYTHON), "manage.py", "migrate", "--run-syncdb"],
        cwd=BACKEND_DIR,
    )
    print("  Migrations applied.")


def seed_data():
    heading("Seeding default data")

    step("Seeding currencies ...")
    run(
        [str(VENV_PYTHON), "manage.py", "seed_currencies"],
        cwd=BACKEND_DIR,
        check=False,
    )

    step("Seeding categories ...")
    run(
        [str(VENV_PYTHON), "manage.py", "seed_categories"],
        cwd=BACKEND_DIR,
        check=False,
    )

    step("Creating test users ...")
    run(
        [str(VENV_PYTHON), "manage.py", "create_test_users"],
        cwd=BACKEND_DIR,
        check=False,
    )

    print("  Default data seeded.")


def setup_frontend():
    heading("Frontend (npm) dependencies")
    node_modules = FRONTEND_DIR / "node_modules"

    if node_modules.exists():
        print("  node_modules already exists — skipping npm install.")
        return

    step("Running npm install (this may take a few minutes) ...")
    run("npm install", cwd=FRONTEND_DIR)
    print("  Frontend dependencies installed.")


# ── Main ─────────────────────────────────────────────────────────────

def main():
    print()
    print("*" * 50)
    print("  Expense Tracker — Development Setup")
    print("*" * 50)

    # Sanity check: are we in the project root?
    if not BACKEND_DIR.exists() or not FRONTEND_DIR.exists():
        print("\n  ERROR: Run this script from the project root directory")
        print(f"         Expected to find: {BACKEND_DIR} and {FRONTEND_DIR}")
        sys.exit(1)

    check_prerequisites()
    setup_venv()
    install_python_deps()
    create_env_file()
    run_migrations()
    seed_data()
    setup_frontend()

    heading("Setup complete!")
    print(
        "  Everything is ready.  Run start.ps1 to launch the servers.\n"
        "\n"
        "  Servers:\n"
        "    Frontend    -> http://localhost:3000\n"
        "    Backend API -> http://localhost:8000/api/\n"
        "    Admin       -> http://localhost:8000/admin/\n"
        "\n"
        "  Test logins:\n"
        "    alice@test.com   / Test@123\n"
        "    bob@test.com     / Test@123\n"
        "    charlie@test.com / Test@123\n"
    )


if __name__ == "__main__":
    main()
