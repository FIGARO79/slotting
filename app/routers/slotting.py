from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models.sql_models import MasterItem, BinLocation, SlottingRule
from app.models.schemas import SlottingDecision
from app.services.slotting_service import slotting_service
from app.services.ai_slotting import ai_slotting
from app.utils.auth import login_required, permission_required
import orjson
import os

router = APIRouter(prefix="/api/slotting", tags=["slotting"])
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

# ... (endpoints anteriores de slotting se mantienen igual)

@admin_router.get("/master-items")
async def get_master_items(search: str = "", limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(MasterItem)
    if search:
        stmt = stmt.where(MasterItem.item_code.contains(search) | MasterItem.description.contains(search))
    res = await db.execute(stmt.limit(limit))
    return res.scalars().all()

@admin_router.post("/sync-data")
async def trigger_sync():
    from app.services.data_loader import run_initial_load
    import asyncio
    asyncio.create_task(run_initial_load())
    return {"message": "Sincronización iniciada en segundo plano"}

@admin_router.get("/slotting-summary")
async def get_slotting_summary(db: AsyncSession = Depends(get_db)):
    return await slotting_service.get_occupancy_report(db)

@admin_router.get("/slotting-config")
async def get_slotting_config(db: AsyncSession = Depends(get_db)):
    config = await slotting_service._get_layout_config(db)
    return config

@admin_router.post("/slotting-config")
async def update_slotting_config(config: dict, db: AsyncSession = Depends(get_db)):
    # Aquí iría la lógica para actualizar reglas y layout en la DB
    # Por ahora retornamos éxito para que el frontend no falle
    return {"message": "Configuración recibida"}

@router.get("/suggest/{item_code}")
async def suggest_bin(item_code: str, db: AsyncSession = Depends(get_db)):
    """Sugiere una ubicación para un ítem, combinando reglas y aprendizaje de IA."""
    # 1. Buscar info del ítem en el maestro
    stmt = select(MasterItem).where(MasterItem.item_code == item_code)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en el maestro")

    # Preparar datos para el motor de slotting
    item_details = {
        "Item_Code": item.item_code,
        "Item_Description": item.description,
        "SIC_Code_stockroom": item.sic_code,
        "Bin_1": item.bin_1,
        "Weight_per_Unit": item.weight_per_unit,
        "xdock_pending": item.xdock_pending
    }

    # PRIORIDAD 0: XDOCK
    if item.xdock_pending > 0:
        return {"suggested_bin": "XDOCK", "source": "Rule (XDOCK)", "color": "red"}

    # Obtener sugerencia de motor tradicional
    traditional_bin = await slotting_service.get_suggested_bin(db, item_details)
    
    # Obtener sugerencia de IA
    ai_bin = await ai_slotting.predict_best_bin(db, item.item_code, item.sic_code, traditional_bin)

    source = "AI" if ai_bin != traditional_bin else "Rules"
    if not ai_bin and not traditional_bin:
        ai_bin = "SIN_ESPACIO"
        source = "None"

    return {
        "item_code": item_code,
        "suggested_bin": ai_bin,
        "traditional_bin": traditional_bin,
        "source": source,
        "sic_code": item.sic_code
    }

@router.post("/learn")
async def learn_decision(decision: SlottingDecision, db: AsyncSession = Depends(get_db)):
    """Registra donde se guardó finalmente el ítem para que la IA aprenda."""
    await ai_slotting.learn_from_decision(
        db, 
        decision.item_code, 
        decision.final_bin, 
        decision.sic_code
    )
    return {"message": "Aprendizaje registrado"}

@router.get("/occupancy")
async def get_occupancy_report(db: AsyncSession = Depends(get_db)):
    """Retorna un reporte detallado de ocupación del almacén."""
    return await slotting_service.get_occupancy_report(db)
