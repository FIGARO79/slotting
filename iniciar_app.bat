111@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    Iniciador de Sistema de Slotting (Portátil)
echo ======================================================

:: Definir rutas locales
set "PYTHON_DIR=%~dp0python_portable"
set "VENV_DIR=%~dp0venv_portable"

:: 1. Verificar si existe Python en el sistema o en la carpeta portable
echo Buscando Python...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PY_CMD=python"
    echo [OK] Python detectado en el sistema.
) else (
    echo [!] Python no detectado en el sistema.
    echo Por favor, asegurese de tener una carpeta 'python_portable' o Python instalado.
    pause
    exit /b
)

:: 2. Crear entorno virtual local (si no existe)
if not exist "%VENV_DIR%" (
    echo [PROCESO] Creando entorno virtual local para no afectar el sistema...
    "%PY_CMD%" -m venv "%VENV_DIR%"
)

:: 3. Activar entorno virtual
echo [PROCESO] Activando entorno...
call "%VENV_DIR%\Scripts\activate"

:: 4. Instalar dependencias (solo si es necesario)
echo [PROCESO] Verificando dependencias...
pip install -r requirements.txt --quiet

:: 5. Iniciar la aplicacion
echo [OK] Iniciando servidor en http://localhost:8000
echo Cierre esta ventana para detener el sistema.
python run.py

pause
