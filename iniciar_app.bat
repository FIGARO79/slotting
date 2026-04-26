@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    Iniciador de Sistema de Slotting (Full Stack)
echo ======================================================

:: Definir ruta del entorno virtual
set "VENV_DIR=%~dp0venv"

:: 1. Verificar si el entorno virtual existe
if not exist "%VENV_DIR%\Scripts\activate" (
    echo [PROCESO] Creando entorno virtual local...
    python -m venv "%VENV_DIR%"
)

:: 2. Activar entorno virtual
echo [PROCESO] Activando entorno...
call "%VENV_DIR%\Scripts\activate"

:: 3. Verificando dependencias críticas
echo [PROCESO] Verificando dependencias...
pip install -r requirements.txt --quiet

:: 4. Iniciar Frontend en ventana separada
echo [PROCESO] Iniciando Frontend (React/Vite)...
start "Slotting FRONTEND" cmd /k "call venv\Scripts\activate && cd frontend && npm run dev"

:: 5. Iniciar Backend en esta ventana
echo [OK] Iniciando Backend en http://localhost:8000
echo Cierre esta ventana para detener el backend.
python run.py

pause
