@echo off
echo ===================================================
echo   Adani RPA Dashboard — Scheduled Tasks Setup
echo ===================================================
echo.

set PROJECT_DIR=%~dp0
set PYTHON_EXE=%PROJECT_DIR%venv\Scripts\python.exe
set REPORTS_SCRIPT=%PROJECT_DIR%send_periodic_reports.py
set MISSING_SCRIPT=%PROJECT_DIR%check_missing_data.py
set AA_SYNC_SCRIPT=%PROJECT_DIR%run_aa_sync.py

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment not found at %PYTHON_EXE%
    echo Please make sure the venv is set up correctly in the backend folder.
    pause
    exit /b 1
)

echo [1/4] Creating Weekly Report Task (Fridays at 5:00 PM)...
schtasks /create /tn "Adani_RPA_Weekly_Report" /tr "\"%PYTHON_EXE%\" \"%REPORTS_SCRIPT%\" --type weekly" /sc weekly /d FRI /st 17:00 /f
echo.

echo [2/4] Creating Monthly Report Task (1st of every month at 9:00 AM)...
schtasks /create /tn "Adani_RPA_Monthly_Report" /tr "\"%PYTHON_EXE%\" \"%REPORTS_SCRIPT%\" --type monthly" /sc monthly /d 1 /st 09:00 /f
echo.

echo [3/4] Creating Missing Data Check Task (Daily at 9:00 AM)...
schtasks /create /tn "Adani_RPA_Missing_Data_Check" /tr "\"%PYTHON_EXE%\" \"%MISSING_SCRIPT%\"" /sc daily /st 09:00 /f
echo.

echo [4/4] Creating AA Sync Tasks (6:00 AM and 6:00 PM daily)...
schtasks /create /tn "Adani_RPA_AA_Sync_Morning" /tr "\"%PYTHON_EXE%\" \"%AA_SYNC_SCRIPT%\" --hours 12" /sc daily /st 06:00 /f
schtasks /create /tn "Adani_RPA_AA_Sync_Evening" /tr "\"%PYTHON_EXE%\" \"%AA_SYNC_SCRIPT%\" --hours 24" /sc daily /st 18:00 /f
echo.

echo ===================================================
echo   Setup Complete! The following tasks are active:
echo.
echo   1. Weekly Report     — Fridays at 5:00 PM IST
echo   2. Monthly Report    — 1st of month at 9:00 AM IST
echo   3. Missing Data Check — Daily at 9:00 AM IST
echo   4. AA Sync (Morning) -- Daily at 6:00 AM IST  (12 hrs - quick dashboard refresh)
echo   5. AA Sync (Evening) -- Daily at 6:00 PM IST  (24 hrs - full day file for SharePoint/users)
echo.
echo   All tasks run via: %PYTHON_EXE%
echo ===================================================
pause
