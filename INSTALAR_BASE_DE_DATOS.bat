@echo off
chcp 65001 >nul
title BellaStyle - Instalar base de datos
cd /d "%~dp0backend"

echo.
echo  BELLASTYLE MANAGER - INSTALAR BASE DE DATOS
echo  -------------------------------------------
echo  Crea la base "bellastylemanager", sus tablas y los datos de prueba.
echo  OJO: si la base ya existe, se borran los datos y se cargan de nuevo.
echo  Usa el usuario y la clave de MySQL de backend\config\config.js
echo.
pause

call npm install --no-audit --no-fund
node instalar_bd.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  Otra opcion: abre init_db.sql en MySQL Workbench y ejecutalo con el rayo.
    pause
    exit /b 1
)

echo.
echo  Contrasenas de prueba:
echo    admin / admin123     estilista / est123   diana / diana123
echo    paula / paula123     cliente / cli123
echo    Codigo para registrar administradoras: BELLA2026
echo.
echo  Siguiente paso: carpeta backend, doble clic en INICIAR_SERVIDOR.bat
pause
