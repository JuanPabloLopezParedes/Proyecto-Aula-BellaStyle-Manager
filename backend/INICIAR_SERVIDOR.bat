@echo off
chcp 65001 >nul
title BellaStyle - Servidor
cd /d "%~dp0"

echo.
echo  BELLASTYLE MANAGER - INICIANDO SERVIDOR
echo  ---------------------------------------
echo.
echo  [1/2] Revisando dependencias (npm install)...
call npm install --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: no se pudieron instalar las dependencias.
    echo  Verifica que Node.js este instalado: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo  [2/2] Arrancando el servidor...
echo.
echo  Abre en el navegador:  http://localhost:3000/welcome.html
echo  Para detenerlo: cierra esta ventana o presiona Ctrl + C
echo.
node app.js
pause
