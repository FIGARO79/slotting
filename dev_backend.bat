@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    MODO DESARROLLO: Backend Slotting (UV Optimized)
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

:: 3. Activar e Iniciar
echo [PROCESO] Iniciando backend (UV: %USE_UV%, Venv: %VENV_PATH%)...
echo [OK] Servidor en: http://localhost:8000
echo [INFO] Hot-Reload activado.
echo ------------------------------------------------------

if "%USE_UV%"=="yes" (
    uv run run.py
) else (
    call %VENV_PATH%\Scripts\activate
    python run.py
)

pause
