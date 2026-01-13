@echo off
echo [AutoAI] Cleaning up ports 3005 (WhatsApp) and 8000 (Backend)...

:: Kill process on port 3005
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3005" ^| find "LISTENING"') do (
    echo Killing PID %%a on port 3005...
    taskkill /f /pid %%a >nul 2>&1
)

:: Kill process on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing PID %%a on port 8000...
    taskkill /f /pid %%a >nul 2>&1
)

:: Kill any stray Node instances running server.js if needed (optional, safer to rely on ports)
:: taskkill /F /IM node.exe /FI "WINDOWTITLE eq AutoAI WhatsApp Service" >nul 2>&1

echo [AutoAI] Cleanup Complete. You can now run start_all.bat safely.
pause
