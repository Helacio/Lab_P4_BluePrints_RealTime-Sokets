@echo off
setlocal
title Lab 5 - Lanzador
set "FRONT=%~dp0"
set "SOCKET=%~dp0..\example-backend-socketio-node-"
set "SOCKET_URL=https://github.com/Helacio/example-backend-socketio-node-.git"

echo ==========================================
echo  Lab 5 - BluePrints en Tiempo Real
echo  Front : %FRONT%
echo  Socket: %SOCKET%
echo ==========================================

if not exist "%SOCKET%\.git" (
  echo [1/3] Clonando backend Socket.IO desde GitHub...
  git clone "%SOCKET_URL%" "%SOCKET%"
)

if not exist "%SOCKET%\node_modules" (
  echo [2/3] Instalando dependencias del backend...
  pushd "%SOCKET%"
  call npm install
  popd
)

if not exist "%FRONT%node_modules" (
  echo [2/3] Instalando dependencias del front...
  pushd "%FRONT%"
  call npm install
  popd
)

if not exist "%FRONT%.env.local" (
  echo [2/3] Creando .env.local con la API REST y Socket.IO...
  (
    echo VITE_API_BASE=http://68.155.159.205:8080
    echo VITE_IO_BASE=http://localhost:3001
  ) > "%FRONT%.env.local"
)

echo [3/3] Levantando servicios...
start "Lab5 Socket.IO :3001" /D "%SOCKET%" cmd /k npm run dev
start "Lab5 Front :5173" /D "%FRONT%" cmd /k npm run dev

echo.
echo Listo. Abri http://localhost:5173  (login: student / student123 - Tecnologia: Socket.IO)
timeout /t 5 >nul 2>&1
