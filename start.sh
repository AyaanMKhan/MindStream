#!/bin/bash

# MindStream Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting MindStream..."
echo "================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if Python 3.11 is installed
PYTHON_VERSION=""
if command_exists python3.11; then
    PYTHON_VERSION="python3.11"
elif command_exists python3; then
    # Check if python3 is 3.11
    PYTHON_MAJOR_MINOR=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    if [[ "$PYTHON_MAJOR_MINOR" == "3.11" ]]; then
        PYTHON_VERSION="python3"
    fi
fi

if [ -z "$PYTHON_VERSION" ]; then
    echo "❌ Python 3.11 is not installed. Please install Python 3.11 and try again."
    echo "   Python 3.12+ and 3.13 have compatibility issues with some packages."
    exit 1
fi

echo "✅ Using Python: $($PYTHON_VERSION --version)"

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check if ports are available
echo "🔍 Checking port availability..."

if port_in_use 8000; then
    echo "⚠️  Port 8000 is already in use. Backend may not start properly."
fi

if port_in_use 3000; then
    echo "⚠️  Port 3000 is already in use. Frontend may not start properly."
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo ""
echo "🐍 Starting backend server..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_VERSION -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if requirements.txt exists and install dependencies
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
else
    echo "⚠️  No requirements.txt found. Installing common FastAPI dependencies..."
    pip install fastapi uvicorn pydantic python-multipart google-generativeai python-dotenv
fi

# Check if environment variables are set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set."
    echo "   The application may not work properly without this API key."
    echo "   Set it with: export GOOGLE_API_KEY='your-google-api-key'"
fi

# Start backend server in background
echo "🚀 Starting FastAPI server on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! port_in_use 8000; then
    echo "❌ Backend failed to start. Check backend.log for details."
    cleanup
fi

echo "✅ Backend server started (PID: $BACKEND_PID)"

# Start frontend
echo ""
echo "⚛️  Starting frontend server..."
cd ../frontend

# Install dependencies if node_modules doesn't exist or package.json is newer
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json 2>/dev/null ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start frontend server in background
echo "🚀 Starting Vite dev server on http://localhost:3000"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if ! port_in_use 3000; then
    echo "❌ Frontend failed to start. Check frontend.log for details."
    cleanup
fi

echo "✅ Frontend server started (PID: $FRONTEND_PID)"

# Return to root directory
cd ..

echo ""
echo "🎉 MindStream is now running!"
echo "================================"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop the servers
wait 