@echo off
:: Runs the CoBot job scheduler in this console (for testing / checking).
:: The service installed by install_nssm_scheduler.bat runs the same thing.
::
::   start_scheduler.bat aa        AA report at 06:00 / 18:00
::   start_scheduler.bat server    backup sync 06:30 / 18:30, reports, missing-data alert
::   start_scheduler.bat server --list    show jobs with last and next run times
set "ROLE=%~1"
if "%ROLE%"=="" (
    echo Usage: %~nx0 aa^|server^|all [--list]
    exit /b 1
)
cd /d "%~dp0backend"
"%~dp0backend\venv\Scripts\python.exe" scheduler_service.py --role %ROLE% %2 %3
