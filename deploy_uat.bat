@echo off
echo ==========================================
echo      RPA Dashboard - UAT Deployment
echo ==========================================

echo [1/4] Building Frontend...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b %errorlevel%
)
cd ..

echo [2/4] Moving Assets to Backend...
if exist backend\static_dist (
    rmdir /s /q backend\static_dist
)
mkdir backend\static_dist
xcopy /E /I /Y frontend\dist backend\static_dist
if %errorlevel% neq 0 (
    echo Failed to move assets!
    exit /b %errorlevel%
)

echo [3/4] Preparing Backend...
cd backend
echo Installing/Updating Python dependencies...
pip install -r requirements.txt

echo [4/4] Starting Server...
echo ==========================================
echo Application running at: http://localhost:8000
echo Ctrl+C to stop.
echo ==========================================
python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
