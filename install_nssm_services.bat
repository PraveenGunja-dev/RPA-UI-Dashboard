@echo off
:: Strip the trailing backslash from the current directory path
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo Installing RPA Dashboard Backend Service...
C:\nssm\nssm.exe install RPABackend "%PROJECT_ROOT%\start_backend.bat"
C:\nssm\nssm.exe set RPABackend AppDirectory "%PROJECT_ROOT%"
mkdir C:\ServiceLogs 2>nul
C:\nssm\nssm.exe set RPABackend AppStdout "C:\ServiceLogs\RPABackend_out.log"
C:\nssm\nssm.exe set RPABackend AppStderr "C:\ServiceLogs\RPABackend_err.log"
sc config RPABackend start= delayed-auto

echo --------------------------------------------------
echo Service Installed Successfully!
echo You can start it right now by running:
echo C:\nssm\nssm.exe start RPABackend
echo --------------------------------------------------
pause
