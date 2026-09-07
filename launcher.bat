@echo off
cd /d "%~dp0"

echo ========================================
echo          RESTAURANT AI
echo ========================================
echo.

where npm.cmd >nul 2>&1
if errorlevel 1 (
	echo Node.js was not found on PATH. Install Node.js and try again.
	pause
	exit /b 1
)

where ollama.exe >nul 2>&1
if errorlevel 1 (
	echo Ollama was not found on PATH. Install Ollama and try again.
	pause
	exit /b 1
)

echo Starting Llama...
start "Llama" cmd /k "ollama run llama3.2"

timeout /t 3 /nobreak >nul

echo Starting Restaurant AI...
start "Restaurant AI" cmd /k "npm.cmd install && npm.cmd run dev"

echo.
echo ========================================
echo Both services are starting...
echo ========================================
echo.
pause