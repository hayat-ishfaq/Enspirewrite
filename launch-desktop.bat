@echo off
title Enspirewrite Desktop
cd /d "%~dp0"

echo ========================================================
echo   Enspirewrite — Tactile Typewriter Journal & Notes
echo ========================================================
echo Starting local offline server...

:: Start Vite in background if not already responding
curl.exe -s -o NUL http://127.0.0.1:5173/
if %ERRORLEVEL% NEQ 0 (
    start /B npm run dev -- --host 127.0.0.1 --port 5173 > nul 2>&1
    timeout /t 2 /nobreak > nul
)

echo Launching Enspirewrite in standalone desktop window...

:: Prefer Microsoft Edge App Mode (built into all Windows 10/11)
start msedge.exe --app="http://127.0.0.1:5173" --window-size=1100,780

if %ERRORLEVEL% NEQ 0 (
    :: Fallback to Chrome App Mode
    start chrome.exe --app="http://127.0.0.1:5173" --window-size=1100,780
)

exit
