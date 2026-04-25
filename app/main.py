from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.routers import planner, slotting
from app.core.db import engine, Base
from app.services.data_loader import run_initial_load
import asyncio

app = FastAPI(title="Slotting & Planning System")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Routers
app.include_router(planner.router)
app.include_router(slotting.router)
app.include_router(slotting.admin_router)

@app.on_event("startup")
async def startup():
    # Crear tablas en la base de datos SQLite si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Cargar datos base en segundo plano para no demorar el inicio del servidor
    asyncio.create_task(run_initial_load())

@app.get("/")
async def root():
    return {"message": "Slotting API is running"}
