@echo off
echo ======================================================
echo    MODO DESARROLLO: Backend Slotting
echo ======================================================

:: Verificar que el entorno virtual existe
if not exist "venv\Scripts\activate" (
    echo [ERROR] No se encontro el entorno virtual en \venv
    echo Por favor, ejecuta 'python -m venv venv' primero.
    pause
    exit /b
)

:: Activar entorno e iniciar
echo [PROCESO] Activando venv...
call venv\Scripts\activate

echo [OK] Servidor en: http://localhost:8000
echo [INFO] Hot-Reload activado. La API y el Frontend se recargaran al guardar cambios.
echo [INFO] Presiona Ctrl+C para detener.
echo ------------------------------------------------------

python run.py

pause
