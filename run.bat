@echo off
echo ===================================================
echo   Starting vertEase Backend and Frontend (Web)
echo ===================================================
echo.

echo [1/2] Starting Backend Server (Express + Neon + ML ONNX)...
start "vertEase Backend" cmd /k "npm run start:server"

echo Waiting for Backend Server to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend App (Expo Web)...
start "vertEase Frontend" cmd /k "npm run web"

echo.
echo ===================================================
echo   Servers launched successfully!
echo   Backend running on: http://localhost:3000
echo   Frontend opening on: http://localhost:8081
echo ===================================================
echo.
