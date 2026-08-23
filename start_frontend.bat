@echo off
cd /d "%~dp0frontend"

echo Building production frontend...
call npm run build

echo Serving frontend on port 5173...
call npx serve -s dist -l 5173
