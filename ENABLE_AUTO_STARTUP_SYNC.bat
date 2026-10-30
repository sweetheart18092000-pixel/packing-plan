@echo off
title Enable Auto Startup Dump Sync
echo ========================================================
echo   ENABLE AUTO STARTUP DUMP SYNC
echo ========================================================
echo.
echo Windows start hone par automatic Dump.xlsx sync on kiya ja raha hai...

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_FOLDER%\PackingPlan_AutoSync.vbs"

echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.CurrentDirectory = "%~dp0" >> "%VBS_FILE%"
echo WshShell.Run "python auto_cloud_sync.py", 0, False >> "%VBS_FILE%"

echo.
echo ========================================================
echo   [SUCCESS] Windows Startup me Auto-Sync Set ho gaya!
echo ========================================================
echo.
echo Har martaba jab PC ON hoga:
echo 1. Yeh background me Dump.xlsx check karega.
echo 2. Agar koi nayi change hui to GitHub Cloud par bhej dega.
echo 3. Bina kisi disturbance ke chup chap complete ho jayega.
echo.
pause
