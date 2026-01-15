@echo off
REM Deployment script for Windows (local testing)
REM For production VPS, use deploy.sh with WSL or Git Bash

echo 🚀 Starting deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
cd frontend
call npm install
cd ..
cd backend
call npm install
cd ..

REM Build application
echo 🔨 Building application...
call npm run build

REM Copy frontend to backend for serving
echo 📋 Copying frontend files...
if not exist "backend\frontend-dist" mkdir backend\frontend-dist
xcopy /E /I /Y frontend\dist\* backend\frontend-dist\

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo ✅ Build complete!
echo 📝 To start the application:
echo    cd backend
echo    npm run start:prod
