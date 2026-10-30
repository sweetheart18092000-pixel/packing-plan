@echo off
title Disable Auto Startup Dump Sync
echo ========================================================
echo   DISABLE AUTO STARTUP DUMP SYNC
echo ========================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_FOLDER%\PackingPlan_AutoSync.vbs"

if exist "%VBS_FILE%" (
    del "%VBS_FILE%"
    echo [SUCCESS] Windows Startup se auto-sync hata diya gaya hai.
) else (
    echo [INFO] Startup me koi auto-sync file mojood nahi thi.
)

echo.
pause
