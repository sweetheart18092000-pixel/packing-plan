@echo off
title Packing Plan - Real-Time Dump & Audit Sync
cd /d "%~dp0"
echo =================================================================
echo   PACKING PLAN - REAL-TIME DUMP & AUDIT WATCHER ACTIVE
echo =================================================================
echo Watching Dump:  Dump.xlsx
echo Watching Audit: E:\Adv. Excel Assignmens\AI Projects\Whatsapp Bot\NQA_Final_Audit_Reports.xlsx
echo.
echo Jab bhi WhatsApp Bot naya Audit save karega ya Dump update hoga,
echo yeh automatically GitHub Cloud update kar dega!
echo.
echo (Is window ko minimize karke chalta rehne dein)
echo =================================================================
echo.
python auto_watch_dump.py
pause
