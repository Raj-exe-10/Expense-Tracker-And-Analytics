# start.ps1 — Launch both backend and frontend dev servers
# Run setup_dev.py first if this is a fresh checkout.

$ErrorActionPreference = "Continue"

$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = Get-Location }

$backendDir  = Join-Path $ROOT "backend"
$frontendDir = Join-Path $ROOT "frontend"
$venvPython  = Join-Path $backendDir "venv\Scripts\python.exe"
$nodeModules = Join-Path $frontendDir "node_modules"

# ─── Pre-flight checks ───────────────────────────────────────────

if (-not (Test-Path $venvPython)) {
    Write-Host "`nBackend virtual environment not found at:" -ForegroundColor Red
    Write-Host "  $venvPython" -ForegroundColor Red
    Write-Host "`nPlease run the setup script first:" -ForegroundColor Yellow
    Write-Host "  python setup_dev.py`n" -ForegroundColor Cyan
    exit 1
}

if (-not (Test-Path $nodeModules)) {
    Write-Host "`nFrontend node_modules not found at:" -ForegroundColor Red
    Write-Host "  $nodeModules" -ForegroundColor Red
    Write-Host "`nPlease run the setup script first:" -ForegroundColor Yellow
    Write-Host "  python setup_dev.py`n" -ForegroundColor Cyan
    exit 1
}

# ─── Start servers ────────────────────────────────────────────────

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Expense Tracker — Starting Servers     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n[1/2] Starting Django backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$backendDir'; & '$venvPython' manage.py runserver"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$frontendDir'; npm start"

# ─── Done ─────────────────────────────────────────────────────────

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " All servers are starting!              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n  Frontend:    http://localhost:3000"    -ForegroundColor White
Write-Host "  Backend API: http://localhost:8000/api/" -ForegroundColor White
Write-Host "  Admin:       http://localhost:8000/admin/" -ForegroundColor White
Write-Host "`n  Login Credentials:"                    -ForegroundColor Cyan
Write-Host "    alice@test.com   / Test@123"           -ForegroundColor White
Write-Host "    bob@test.com     / Test@123"           -ForegroundColor White
Write-Host "    charlie@test.com / Test@123"           -ForegroundColor White
Write-Host "`n  Press Ctrl+C in each window to stop." -ForegroundColor Yellow
