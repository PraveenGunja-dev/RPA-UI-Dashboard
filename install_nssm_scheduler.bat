@echo off
:: Installs the CoBot job scheduler as a Windows service with NSSM, so the
:: jobs run at their times without anyone logged in, and the service restarts
:: itself if it stops. Run from an Administrator command prompt.
::
::   install_nssm_scheduler.bat aa               on the PC that runs the AA sync (06:00 / 18:00)
::   install_nssm_scheduler.bat server            on the dashboard server (backup sync, reports, alerts)
::   install_nssm_scheduler.bat all               if one machine does both
::   install_nssm_scheduler.bat server QA         same, tagged so it can share a
::                                                 machine with a production scheduler
::                                                 (service becomes RPAScheduler_server_QA,
::                                                 and the old-Task-Scheduler-jobs cleanup
::                                                 below is skipped, since those are
::                                                 machine-wide names that may belong to
::                                                 production - handle them yourself)
::
:: NSSM is expected at C:\nssm\nssm.exe (set NSSM=... to use another path).
setlocal
set "ROLE=%~1"
set "ENV_TAG=%~2"
if /i not "%ROLE%"=="aa" if /i not "%ROLE%"=="server" if /i not "%ROLE%"=="all" (
    echo Usage: %~nx0 aa^|server^|all [environment-tag]
    exit /b 1
)

if "%NSSM%"=="" set "NSSM=C:\nssm\nssm.exe"
if not exist "%NSSM%" (
    echo NSSM not found at %NSSM% - install it there, or set NSSM=path\to\nssm.exe
    exit /b 1
)

set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "BACKEND=%PROJECT_ROOT%\backend"
set "PY=%BACKEND%\venv\Scripts\python.exe"
if not exist "%PY%" (
    echo Python venv not found: %PY%
    exit /b 1
)
set "SERVICE=RPAScheduler_%ROLE%"
if not "%ENV_TAG%"=="" set "SERVICE=%SERVICE%_%ENV_TAG%"

echo Installing %SERVICE% ...
"%NSSM%" stop %SERVICE% >nul 2>&1
"%NSSM%" remove %SERVICE% confirm >nul 2>&1
"%NSSM%" install %SERVICE% "%PY%" scheduler_service.py --role %ROLE%
"%NSSM%" set %SERVICE% AppDirectory "%BACKEND%"
if "%ENV_TAG%"=="" (
    "%NSSM%" set %SERVICE% DisplayName "CoBot Job Scheduler (%ROLE%)"
) else (
    "%NSSM%" set %SERVICE% DisplayName "CoBot Job Scheduler (%ROLE% / %ENV_TAG%)"
)
"%NSSM%" set %SERVICE% Description "Runs CoBot jobs at fixed IST times (see backend\scheduler_service.py)"
"%NSSM%" set %SERVICE% AppEnvironmentExtra PYTHONUNBUFFERED=1 PYTHONIOENCODING=utf-8
mkdir C:\ServiceLogs 2>nul
"%NSSM%" set %SERVICE% AppStdout "C:\ServiceLogs\%SERVICE%_out.log"
"%NSSM%" set %SERVICE% AppStderr "C:\ServiceLogs\%SERVICE%_err.log"
"%NSSM%" set %SERVICE% AppRotateFiles 1
"%NSSM%" set %SERVICE% AppRotateBytes 10485760
"%NSSM%" set %SERVICE% AppExit Default Restart
"%NSSM%" set %SERVICE% AppRestartDelay 60000
"%NSSM%" set %SERVICE% Start SERVICE_DELAYED_AUTO_START

if not "%ENV_TAG%"=="" (
    echo Skipping old-Task-Scheduler-jobs cleanup: %ENV_TAG% tag implies this
    echo machine may also run production, and those tasks are machine-wide
    echo names ^(Adani_RPA_AA_Sync_Morning etc^) that could belong to it.
    echo Check schtasks /query /tn "Adani_RPA_*" yourself before disabling any.
) else (
    :: These Task Scheduler jobs are replaced by the service. Disable them (not
    :: delete) so nothing runs twice. On the AA PC the weekly / monthly / missing
    :: data jobs must not run at all: they read that PC's copy of the database,
    :: not the server's.
    for %%T in (Adani_RPA_AA_Sync_Morning Adani_RPA_AA_Sync_Evening Adani_RPA_Weekly_Report Adani_RPA_Monthly_Report Adani_RPA_Missing_Data_Check) do (
        schtasks /query /tn "%%T" >nul 2>&1 && (
            schtasks /change /tn "%%T" /disable >nul && echo Disabled old scheduled task %%T
        )
    )
)

"%NSSM%" start %SERVICE%
echo --------------------------------------------------
"%PY%" "%BACKEND%\scheduler_service.py" --role %ROLE% --list
echo --------------------------------------------------
echo Service: %SERVICE%   (services.msc, or "%NSSM%" status %SERVICE%)
echo Log:     %BACKEND%\logs\scheduler\scheduler.log
pause
