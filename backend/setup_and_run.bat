@echo off
title Smart Learners AI - Backend Server

echo ==========================================
echo   SMART LEARNERS AI - Backend Setup
echo ==========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.9+ and try again.
    pause
    exit /b 1
)

echo [1/4] Python found!
echo.

:: Check if virtual environment exists
if not exist "venv" (
    echo [2/4] Creating virtual environment...
    python -m venv venv
    echo Virtual environment created!
) else (
    echo [2/4] Virtual environment already exists.
)
echo.

:: Activate virtual environment and install dependencies
echo [3/4] Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
echo Dependencies installed!
echo.

:: Run migrations
echo [4/4] Setting up database...
python manage.py makemigrations --noinput
python manage.py migrate --noinput
echo Database ready!
echo.

echo ==========================================
echo   Starting Django Server on port 8000
echo ==========================================
echo.
echo Backend URL: http://localhost:8000
echo API Health: http://localhost:8000/api/auth/health/
echo Admin Panel: http://localhost:8000/admin/
echo.
echo Press Ctrl+C to stop the server.
echo.

python manage.py runserver 0.0.0.0:8000
