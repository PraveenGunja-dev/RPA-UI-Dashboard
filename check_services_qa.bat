@echo off
:: Quick status check for the QA-specific services (RPABackend_QA,
:: RPAScheduler_*_QA). Doesn't touch production's RPABackend.
:: Run from any command prompt (doesn't need Administrator just to check).
if "%NSSM%"=="" set "NSSM=C:\nssm\nssm.exe"

echo ==================================================
echo   Service status
echo ==================================================
for %%S in (RPABackend_QA RPAScheduler_aa_QA RPAScheduler_server_QA RPAScheduler_all_QA) do (
    sc query %%S >nul 2>&1 && (
        echo --- %%S ---
        "%NSSM%" status %%S
    )
)

echo.
echo ==================================================
echo   Scheduler job timing (server role)
echo ==================================================
cd /d "%~dp0backend"
venv\Scripts\python.exe scheduler_service.py --role server --list

pause
