@echo off
cd /d "%~dp0"
call backend\venv\Scripts\activate.bat
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 3123
