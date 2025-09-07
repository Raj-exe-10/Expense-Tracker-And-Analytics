# PowerShell script to start both backend and frontend servers

Write-Host "Starting Expense Tracker Application..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Start Django backend server
Write-Host "`nStarting Django Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start React frontend server
Write-Host "Starting React Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "`n✅ Both servers are starting..." -ForegroundColor Green
Write-Host "`nAccess the application at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8000/api/" -ForegroundColor White
Write-Host "  Django Admin: http://localhost:8000/admin/" -ForegroundColor White
Write-Host "`nLogin Credentials:" -ForegroundColor Cyan
Write-Host "  Admin: admin@example.com / Admin123!" -ForegroundColor White
Write-Host "  Test User: test@example.com / Test123!" -ForegroundColor White
Write-Host "`nPress Ctrl+C in each window to stop the servers" -ForegroundColor Yellow
