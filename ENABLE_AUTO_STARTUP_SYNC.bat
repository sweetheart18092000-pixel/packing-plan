@echo off
title Enable Auto Real-Time Dump Watcher
echo ========================================================
echo   ENABLE REAL-TIME BACKGROUND DUMP WATCHER
echo ========================================================
echo.
echo Windows start hone par automatic Dump.xlsx Watcher on kiya ja raha hai...

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_FOLDER%\PackingPlan_AutoSync.vbs"

echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.CurrentDirectory = "%~dp0" >> "%VBS_FILE%"
echo WshShell.Run "python auto_watch_dump.py", 0, False >> "%VBS_FILE%"

echo.
echo ========================================================
echo   [SUCCESS] Windows Startup me Live Watcher Set ho gaya!
echo ========================================================
echo.
echo Ab:
echo 1. Jab bhi PC ON hoga, yeh watcher background me chalta rahega.
echo 2. Jab bhi aap Dump.xlsx ko replace ya save karenge:
echo    Yeh khud ba khud 3 second me GitHub Cloud par update bhej dega!
echo 3. Bina kisi disturbance ke chup chap complete karega.
echo.
pause
