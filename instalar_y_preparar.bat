@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    Instalador y Preparador de Sistema de Slotting
echo ======================================================

:: 1. Verificar Python
echo [1/4] Verificando Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python no encontrado. Por favor, instale Python o use una version portable.
    pause
    exit /b
)
echo [OK] Python detectado.

:: 2. Crear y configurar Entorno Virtual de Python
echo [2/4] Configurando entorno virtual de Python...
if not exist "venv" (
    python -m venv venv
    echo [OK] Entorno virtual creado.
)

echo [PROCESO] Instalando dependencias de Python y Nodeenv...
call venv\Scripts\activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
echo [OK] Dependencias de Python listas.

:: 3. Configurar Node.js dentro del Venv (si no existe)
echo [3/4] Configurando Node.js local (sin admin)...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Node.js no detectado. Instalando Node.js dentro del entorno virtual...
    :: nodeenv -p integra Node en el venv actual de Python
    call nodeenv -p --node=20.11.0
    echo [OK] Node.js instalado en el entorno virtual.
) else (
    echo [OK] Node.js ya esta disponible en el sistema.
)

:: 4. Compilar Frontend
echo [4/4] Compilando Frontend...
cd frontend
echo [PROCESO] Instalando dependencias de Node.js (npm install)...
call npm install --silent
echo [PROCESO] Generando archivos de produccion (npm run build)...
call npm run build
cd ..

echo ======================================================
echo    INSTALACION COMPLETADA CON EXITO
echo ======================================================
echo Todo esta listo. Ya no necesitas Node.js externo.
echo Para iniciar la aplicacion, use: iniciar_app.bat
echo ======================================================
pause
