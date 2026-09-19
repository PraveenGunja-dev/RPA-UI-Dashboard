@echo off
:: Superseded: jobs now run from the NSSM scheduler service
:: (backend\scheduler_service.py), which works without anyone logged in and
:: catches up runs missed while the machine was off. Creating these Task
:: Scheduler jobs as well would run every job twice.
echo ===================================================
echo   Scheduled tasks are now run by the NSSM service.
echo.
echo   From the project folder, as Administrator:
echo     install_nssm_scheduler.bat aa       (PC that runs the AA sync)
echo     install_nssm_scheduler.bat server   (dashboard server)
echo ===================================================
pause
exit /b 1
