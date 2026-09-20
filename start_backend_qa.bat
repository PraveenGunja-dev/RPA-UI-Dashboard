@echo off
:: QA (cobot-testing) backend starter. Completely separate from production's
:: start_backend.bat / RPABackend service, so both can run on the same
:: machine without conflict - different port, different process.
::
:: Set QA_PORT below to whatever Nginx forwards /cobot-testing/ requests to.
:: It must NOT be the same port production uses (start_backend.bat: 3123).
set QA_PORT=3124

cd /d "%~dp0"
call backend\venv\Scripts\activate.bat
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port %QA_PORT%
