@echo off
SETLOCAL EnableDelayedExpansion

echo ======================================================
echo    Instalador Inteligente (UV Optimized) - Slotting
echo ======================================================

:: 1. Deteccion de UV
echo [1/5] Verificando motor de ejecucion...
set "USE_UV=no"
where uv >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] UV detectado en el sistema.
    set "USE_UV=yes"
) else (
    echo [INFO] UV no detectado. Intentando instalacion automatica...
    
    :: Intento 1: PowerShell Oficial
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex" >nul 2>nul
    
    :: Verificar si se instalo
    where uv >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] UV instalado exitosamente via PowerShell.
        set "USE_UV=yes"
    ) else (
        :: Intento 2: PIP
        echo [INFO] Fallo instalacion oficial. Intentando via PIP...
        python -m pip install uv --quiet >nul 2>nul
        
        where uv >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo [OK] UV instalado exitosamente via PIP.
            set "USE_UV=yes"
        ) else (
            echo [WARN] No se pudo instalar UV. Se usara Python estandar.
        )
    )
)

:: 2. Crear y configurar Entorno Virtual (.venv)
echo [2/5] Configurando entorno virtual...
if "%USE_UV%"=="yes" (
    if not exist ".venv" (
        echo [PROCESO] Creando entorno con UV ^(Python 3.12^)...
        uv venv --python 3.12
    )
    echo [PROCESO] Sincronizando dependencias con UV...
    uv pip install -r requirements.txt --quiet
    set "VENV_ACTIVATE=.venv\Scripts\activate"
) else (
    if not exist ".venv" (
        echo [PROCESO] Creando entorno con VENV estandar...
        python -m venv .venv
    )
    echo [PROCESO] Instalando dependencias via PIP...
    call .venv\Scripts\activate
    pip install -r requirements.txt --quiet
    set "VENV_ACTIVATE=.venv\Scripts\activate"
)

:: 3. Configurar Node.js dentro del Venv
echo [3/5] Configurando Node.js local (Nodeenv)...
call %VENV_ACTIVATE%
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Instalando Node.js dentro del entorno virtual...
    call nodeenv -p --node=20.11.0 --quiet
    echo [OK] Node.js integrado.
) else (
    echo [OK] Node.js disponible.
)

:: 4. Compilar Frontend
echo [4/5] Compilando Frontend...
cd frontend
echo [PROCESO] Preparando modulos de Node...
call npm install --silent
echo [PROCESO] Generando build de produccion...
call npm run build
cd ..

:: 5. Limpieza
echo [5/5] Finalizando...
echo ======================================================
echo    INSTALACION COMPLETADA CON EXITO (UV: %USE_UV%)
echo ======================================================
echo Use 'iniciar_app.bat' para lanzar el sistema.
pause
