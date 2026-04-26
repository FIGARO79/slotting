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
echo [PROCESO] Actuando entorno...
call "%VENV_DIR%\Scripts\activate"

:: 3. Verificando dependencias críticas
echo [PROCESO] Verificando dependencias...
pip install -r requirements.txt --quiet

:: 4. Iniciar Frontend en ventana minimizada
echo [PROCESO] Lanzando entorno discreto...
start /min "Slotting FRONTEND" cmd /c "call venv\Scripts\activate && cd frontend && npm run dev"

:: 5. Iniciar Backend en ventana minimizada
start /min "Slotting BACKEND" cmd /c "call venv\Scripts\activate && python run.py"

echo [OK] El sistema se esta iniciando en segundo plano.
echo El navegador se abrira automaticamente en unos segundos.
echo Al cerrar la pestaña de la aplicacion, los servidores se apagaran solos.
timeout /t 5 >nul

exit
