@echo off
:: Installs the QA (cobot-testing) dashboard backend as its OWN Windows
:: service - "RPABackend_QA" - completely separate from production's
:: "RPABackend" service (install_nssm_services.bat). Safe to run on the
:: same machine as production: different service name, different port
:: (see start_backend_qa.bat), different log files. Never touches the
:: production service. Run from an Administrator command prompt.
setlocal
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "SERVICE=RPABackend_QA"

if "%NSSM%"=="" set "NSSM=C:\nssm\nssm.exe"
if not exist "%NSSM%" (
    echo NSSM not found at %NSSM% - set NSSM=path\to\nssm.exe first
    exit /b 1
)

echo Installing %SERVICE% (QA / cobot-testing) ...
"%NSSM%" stop %SERVICE% >nul 2>&1
"%NSSM%" remove %SERVICE% confirm >nul 2>&1
"%NSSM%" install %SERVICE% "%PROJECT_ROOT%\start_backend_qa.bat"
"%NSSM%" set %SERVICE% AppDirectory "%PROJECT_ROOT%"
"%NSSM%" set %SERVICE% DisplayName "CoBot Dashboard Backend (QA / cobot-testing)"
mkdir C:\ServiceLogs 2>nul
"%NSSM%" set %SERVICE% AppStdout "C:\ServiceLogs\%SERVICE%_out.log"
"%NSSM%" set %SERVICE% AppStderr "C:\ServiceLogs\%SERVICE%_err.log"
"%NSSM%" set %SERVICE% AppRotateFiles 1
"%NSSM%" set %SERVICE% AppRotateBytes 10485760
"%NSSM%" set %SERVICE% AppExit Default Restart
"%NSSM%" set %SERVICE% AppRestartDelay 60000
"%NSSM%" set %SERVICE% Start SERVICE_DELAYED_AUTO_START

"%NSSM%" start %SERVICE%
echo --------------------------------------------------
echo Service Installed: %SERVICE%   (production's RPABackend is untouched)
echo Status:  "%NSSM%" status %SERVICE%   or services.msc
echo Logs:    C:\ServiceLogs\%SERVICE%_out.log / _err.log
echo Port:    see QA_PORT in start_backend_qa.bat (must match Nginx's
echo          proxy_pass target for /cobot-testing/)
echo --------------------------------------------------
pause
