from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import planner, slotting
from app.core.db import engine, Base
from app.services.data_loader import run_initial_load
import asyncio
import os

app = FastAPI(title="Slotting & Planning System")

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
app.include_router(slotting.admin_router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    asyncio.create_task(run_initial_load())

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
