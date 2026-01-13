@echo off
echo Starting AutoAI Ecosystem...
echo --------------------------------
echo [1/4] Ensuring clean state...
call panic_button_clean_ports.bat < nul
cls
:: Start WhatsApp Service in a new window
echo [2/4] Starting WhatsApp Service (Port 3005)...
start "AutoAI WhatsApp Service" cmd /k "cd whatsapp-service && npm start"

:: Start Backend in a new window
echo Starting Backend...
start "AutoAI Backend" cmd /k "cd backend && python run.py"

:: Start Frontend in a new window
echo Starting Frontend...
start "AutoAI Frontend" cmd /k "cd frontend && npm run dev"

echo Services started!
echo WhatsApp Service: http://localhost:3005
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:5173
pause
