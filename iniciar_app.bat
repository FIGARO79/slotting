@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    Iniciador Inteligente (UV Optimized) - Slotting
echo ======================================================

:: 1. Deteccion de UV
set "USE_UV=no"
where uv >nul 2>nul
if %ERRORLEVEL% EQU 0 set "USE_UV=yes"

:: 2. Verificar existencia del entorno virtual (.venv o venv)
set "VENV_PATH=.venv"
if not exist ".venv\Scripts\activate" (
    if exist "venv\Scripts\activate" (
        set "VENV_PATH=venv"
    ) else (
        echo [ERROR] No se encontro el entorno virtual ^(.venv o venv^).
        echo Por favor, ejecute 'instalar_y_preparar.bat' primero.
        pause
        exit /b
    )
)

:: 3. Lanzamiento de servicios
echo [PROCESO] Iniciando servicios (UV: %USE_UV%, Venv: %VENV_PATH%)...

if "%USE_UV%"=="yes" (
    :: Iniciar Frontend con UV
    start /min "Slotting FRONTEND" cmd /c "cd frontend && uv run npm run dev"
    :: Iniciar Backend con UV
    start /min "Slotting BACKEND" cmd /c "uv run run.py"
) else (
    :: Fallback tradicional
    start /min "Slotting FRONTEND" cmd /c "call %VENV_PATH%\Scripts\activate && cd frontend && npm run dev"
    start /min "Slotting BACKEND" cmd /c "call %VENV_PATH%\Scripts\activate && python run.py"
)

echo [OK] El sistema se esta iniciando en segundo plano.
echo El navegador se abrira automaticamente en unos segundos.
timeout /t 5 >nul
exit
