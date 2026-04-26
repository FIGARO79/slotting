from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any, Optional
from app.core.db import get_db
from app.models.sql_models import MasterItem, BinLocation, SlottingRule
from app.models.schemas import SlottingDecision
from app.services.slotting_service import slotting_service
from app.services.ai_slotting import ai_slotting
from app.services.data_loader import get_files_status, load_master_data, load_layout_data
import orjson
import os
import io
import polars as pl
from datetime import datetime

router = APIRouter(prefix="/api/slotting", tags=["slotting"])

@router.post("/export-table")
async def export_table_to_excel(data: List[Dict[str, Any]]):
    """Convierte los datos enviados desde el frontend en un archivo Excel."""
    if not data:
        raise HTTPException(status_code=400, detail="No hay datos para exportar.")

    # Mapeo de nombres para el Excel final
    mapped_data = []
    for row in data:
        mapped_data.append({
            "SKU": row.get("item_code"),
            "Descripcion": row.get("description"),
            "SIC": row.get("sic"),
            "ABC": row.get("abc"),
            "Ubicacion_Actual": row.get("current_bin"),
            "Ubicacion_Sugerida": row.get("suggested_bin"),
            "Score_Fisico": row.get("prox_score"),
            "Mejora_PTS": row.get("improvement") if row.get("improvement", 0) > 0 else "REGLA"
        })

    # Crear DataFrame y exportar a Buffer Excel
    df = pl.DataFrame(mapped_data)
    
    output = io.BytesIO()
    df.write_excel(output)
    output.seek(0)
    
    filename = f"Plan_Slotting_Vista_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/files-status")
def get_files_info():
    """Retorna el estado y timestamp de los archivos en la carpeta datos/"""
    return get_files_status()

@router.post("/sync-data")
async def trigger_sync():
    """Recarga los datos desde los archivos físicos Excel."""
    try:
        await load_master_data("datos/AURRSGLBD0250 - Item Stockroom Balance.xlsx")
        await load_layout_data("datos/layout_almacen.xlsx")
        return {"message": "Datos recargados exitosamente desde archivos locales"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/master-items")
async def get_master_items(search: str = "", limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(MasterItem).where(MasterItem.physical_qty > 0)
    if search:
        stmt = stmt.where(MasterItem.item_code.contains(search) | MasterItem.description.contains(search))
    res = await db.execute(stmt.limit(limit))
    return res.scalars().all()

@router.get("/occupancy")
async def get_occupancy_report(db: AsyncSession = Depends(get_db)):
    """Retorna un reporte detallado de ocupación del almacén."""
    return await slotting_service.get_occupancy_report(db)

@router.get("/slotting-config")
async def get_slotting_config(db: AsyncSession = Depends(get_db)):
    return await slotting_service._get_layout_config(db)

@router.post("/slotting-config")
async def update_slotting_config(config: dict, db: AsyncSession = Depends(get_db)):
    return await slotting_service.update_config(db, config)

@router.get("/suggest/{item_code}")
async def suggest_bin(item_code: str, db: AsyncSession = Depends(get_db)):
    """Sugiere una ubicación para un ítem, combinando reglas y aprendizaje de IA."""
    stmt = select(MasterItem).where(MasterItem.item_code == item_code.upper())
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado en el maestro")

    # Serialización explícita
    item_data = {
        "item_code": item.item_code,
        "description": item.description,
        "sic_code": item.sic_code,
        "abc_code": item.abc_code,
        "bin_1": item.bin_1,
        "weight_per_unit": item.weight_per_unit,
        "physical_qty": item.physical_qty,
        "frozen_qty": item.frozen_qty
    }

    item_details = {
        "Item_Code": item.item_code,
        "Item_Description": item.description,
        "SIC_Code_stockroom": item.sic_code,
        "Bin_1": item.bin_1,
        "Weight_per_Unit": item.weight_per_unit
    }

    # Motor de reglas y IA (Solo bines de almacenamiento)
    traditional_bin = await slotting_service.get_suggested_bin(db, item_details)
    ai_bin = await ai_slotting.predict_best_bin(db, item.item_code, item.sic_code, traditional_bin)

    # Obtener el score de la ubicación sugerida para el frontend
    config = await slotting_service._get_layout_config(db)
    storage = config.get('storage', {})
    
    suggested_bin_info = storage.get(ai_bin or traditional_bin, {})
    suggested_score = suggested_bin_info.get('score', 0)
    
    current_bin_info = storage.get(item.bin_1.upper() if item.bin_1 else "", {})
    current_score = current_bin_info.get('score', 0)

    source = "AI" if ai_bin != traditional_bin else "Rules"
    if not ai_bin and not traditional_bin:
        ai_bin = "SIN_ESPACIO"
        source = "None"

    return {
        "item_code": item_code,
        "item": item_data,
        "suggested_bin": ai_bin,
        "suggested_bin_score": suggested_score,
        "current_bin_score": current_score,
        "traditional_bin": traditional_bin,
        "source": source,
        "sic_code": item.sic_code,
        "is_misplaced": ai_bin is not None and ai_bin != item.bin_1 and ai_bin != "SIN_ESPACIO"
    }

@router.get("/mass-analysis")
async def perform_mass_analysis(db: AsyncSession = Depends(get_db)):
    """Analiza todos los ítems del maestro y devuelve aquellos que requieren reubicación."""
    stmt = select(MasterItem).where(MasterItem.physical_qty > 0)
    res = await db.execute(stmt)
    items = res.scalars().all()
    
    config = await slotting_service._get_layout_config(db)
    storage = config.get('storage', {})
    
    analysis_results = []
    for item in items:
        item_details = {
            "Item_Code": item.item_code,
            "Item_Description": item.description,
            "SIC_Code_stockroom": item.sic_code,
            "Weight_per_Unit": item.weight_per_unit,
            "Bin_1": item.bin_1
        }
        
        suggestion = await slotting_service.get_suggested_bin(db, item_details)
        
        if suggestion and suggestion != item.bin_1:
            # Usar Scores físicos del layout (0-10)
            current_info = storage.get(item.bin_1, {})
            current_score = current_info.get('score', 0)
            
            sugg_info = storage.get(suggestion, {})
            sugg_score = sugg_info.get('score', 0)
            
            # Lógica de Mejora Diferenciada:
            if item.sic_code in ['0', 'Z', 'L']:
                # Para items muertos, la mejora es LIBERAR puntos altos
                # (Score Actual - Score Sugerido)
                improvement = current_score - sugg_score
            else:
                # Para items activos, la mejora es GANAR proximidad
                # (Score Sugerido - Score Actual)
                improvement = sugg_score - current_score
            
            analysis_results.append({
                "item_code": item.item_code,
                "description": item.description,
                "current_bin": item.bin_1,
                "suggested_bin": suggestion,
                "sic": item.sic_code,
                "abc": item.abc_code,
                "weight": item.weight_per_unit,
                "prox_score": sugg_score,
                "improvement": improvement
            })
            
    # Ordenar por mayor mejora de score físico
    analysis_results.sort(key=lambda x: x['improvement'], reverse=True)
            
    return {
        "total_analyzed": len(items),
        "total_mismatches": len(analysis_results),
        "suggestions": analysis_results
    }

@router.post("/learn")
async def learn_decision(decision: SlottingDecision, db: AsyncSession = Depends(get_db)):
    await ai_slotting.learn_from_decision(db, decision.item_code, decision.final_bin, decision.sic_code)
    return {"message": "Aprendizaje registrado"}
