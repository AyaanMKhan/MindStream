@echo off
setlocal enabledelayedexpansion

REM MindStream Startup Script for Windows
REM This script starts both the backend and frontend servers

echo 🚀 Starting MindStream...
echo ================================

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed or not in PATH. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check if ports are available
echo 🔍 Checking port availability...

netstat -an | findstr ":8000" >nul
if not errorlevel 1 (
    echo ⚠️  Port 8000 is already in use. Backend may not start properly.
)

netstat -an | findstr ":3000" >nul
if not errorlevel 1 (
    echo ⚠️  Port 3000 is already in use. Frontend may not start properly.
)

REM Start backend
echo.
echo 🐍 Starting backend server...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
if exist "requirements.txt" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
) else (
    echo ⚠️  No requirements.txt found. Installing common FastAPI dependencies...
    pip install fastapi uvicorn pydantic python-multipart google-generativeai python-dotenv
)

REM Check if environment variables are set
if "%GOOGLE_API_KEY%"=="" (
    echo ⚠️  Warning: GOOGLE_API_KEY not set.
    echo    The application may not work properly without this API key.
)

REM Start backend server in background
echo 🚀 Starting FastAPI server on http://localhost:8000
start "MindStream Backend" cmd /c "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo ⚛️  Starting frontend server...
cd ..\frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start frontend server in background
echo 🚀 Starting Vite dev server on http://localhost:3000
start "MindStream Frontend" cmd /c "npm run dev"

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

REM Return to root directory
cd ..

echo.
echo 🎉 MindStream is now running!
echo ================================
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause 