from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import planner, slotting
from app.core.db import engine, Base
from app.services.data_loader import run_initial_load
import asyncio
import os
import time
import sys

app = FastAPI(title="Slotting & Planning System")

# --- SISTEMA HEARTBEAT (Auto-Apagado) ---
LAST_HEARTBEAT = time.time()

@app.get("/api/heartbeat")
async def heartbeat():
    global LAST_HEARTBEAT
    LAST_HEARTBEAT = time.time()
    return {"status": "alive"}

async def check_heartbeat():
    """Tarea que apaga el servidor si no hay actividad en el navegador."""
    global LAST_HEARTBEAT
    while True:
        await asyncio.sleep(10)
        if time.time() - LAST_HEARTBEAT > 20:
            print("🛑 No se detecta actividad en el navegador. Cerrando servidores...")
            # Cerrar procesos de Node (Vite) si están en el mismo grupo
            if os.name == 'nt':
                os.system('taskkill /F /IM node.exe /T >nul 2>&1')
            
            # Matar el proceso actual de Python
            os._exit(0)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Routers (Ya tienen el prefijo /api definido en sus respectivos archivos)
app.include_router(planner.router)
app.include_router(slotting.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    asyncio.create_task(run_initial_load())
    asyncio.create_task(check_heartbeat())

# Definir la ruta del frontend
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")

# Servir archivos estáticos específicos (assets)
assets_path = os.path.join(frontend_path, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# Ruta para servir el index.html en la raíz y cualquier otra ruta no capturada (SPA fallback)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Si la ruta comienza con /api, no servir el frontend (dejar que FastAPI maneje el 404 de la API)
    if full_path.startswith("api"):
        return {"detail": "Not Found", "path": full_path}
    
    # Para cualquier otra ruta, servir el frontend
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        return {"message": "API running, but frontend/dist not found. Run 'npm run build' in frontend folder."}
