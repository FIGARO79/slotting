import polars as pl
import os
import asyncio
import datetime
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sql_models import MasterItem, BinLocation
from app.core.db import async_session
from app.services.ai_slotting import ai_slotting

def get_files_status():
    """Retorna información sobre los archivos físicos en la carpeta datos/"""
    files = ["datos/AURRSGLBD0250 - Item Stockroom Balance.xlsx", "datos/layout_almacen.xlsx"]
    status = []
    for f in files:
        if os.path.exists(f):
            stats = os.stat(f)
            mtime = datetime.datetime.fromtimestamp(stats.st_mtime)
            status.append({
                "file": f.split("/")[-1],
                "exists": True,
                "timestamp": mtime.strftime("%Y-%m-%d %H:%M:%S"),
                "size_kb": round(stats.st_size / 1024, 2)
            })
        else:
            status.append({"file": f.split("/")[-1], "exists": False})
    return status

async def load_master_data(xlsx_path: str):
    """Carga el maestro de inventario desde el Excel exportado del ERP"""
    if not os.path.exists(xlsx_path):
        print(f"Archivo no encontrado: {xlsx_path}")
        return

    # Leer Excel con Polars
    df = pl.read_excel(xlsx_path)
    
    # Normalizar nombres de columnas (quitar espacios dobles accidentales)
    df.columns = [c.replace("  ", " ").strip() for c in df.columns]

    # Mapeo de nombres reales del Excel (Espacios) a nombres internos (Guiones bajos)
    mapping = {
        "Item Code": "Item_Code",
        "Item Description": "description",
        "ABC Code (stockroom)": "abc_code",
        "SIC Code (stockroom)": "sic_code",
        "Default Bin Location": "Bin_1",
        "Additional Bin Locations": "additional_bin",
        "Physical Qty": "physical_qty",
        "Frozen Qty": "frozen_qty",
        "Weight per Unit": "weight_per_unit",
        "Reserved Qty": "xdock_pending"
    }

    # Renombrar columnas encontradas
    available_renames = {old: new for old, new in mapping.items() if old in df.columns}
    df = df.rename(available_renames)

    # Ahora seleccionamos usando los nombres NUEVOS (los del value en el mapping)
    # Si alguna columna vital falta (como Item_Code), lanzamos un error claro
    if "Item_Code" not in df.columns:
        print(f"⚠️ Error crítico: No se encontró la columna 'Item Code' en el Excel. Columnas detectadas: {df.columns}")
        return

    df_clean = df.select([
        pl.col("Item_Code").cast(pl.Utf8),
        pl.col("description").fill_null("SIN DESCRIPCION").cast(pl.Utf8),
        pl.col("abc_code").fill_null("C").cast(pl.Utf8),
        pl.col("sic_code").fill_null("0").cast(pl.Utf8),
        pl.col("Bin_1").fill_null("").cast(pl.Utf8),
        pl.col("additional_bin").fill_null("").cast(pl.Utf8),
        pl.col("physical_qty").fill_null(0.0).cast(pl.Float64),
        pl.col("frozen_qty").fill_null(0.0).cast(pl.Float64),
        pl.col("weight_per_unit").fill_null(0.0).cast(pl.Float64),
        pl.col("xdock_pending").fill_null(0).cast(pl.Int64)
    ]).unique(subset=["Item_Code"])

    # 1. Obtener datos actuales antes de borrar (para comparar y aprender)
    async with async_session() as session:
        res_old = await session.execute(select(MasterItem.item_code, MasterItem.bin_1, MasterItem.sic_code))
        old_data = {r[0]: {"bin": r[1], "sic": r[2]} for r in res_old.all()}
    
    # Lista para recolectar movimientos de calidad para aprendizaje posterior
    quality_movements = []

    # 2. Cargar nuevos datos del maestro
    async with async_session() as session:
        async with session.begin():
            await session.execute(delete(MasterItem))
            
            items = []
            for row in df_clean.to_dicts():
                item_code = str(row["Item_Code"]).strip()
                new_bin = row["Bin_1"]
                sic_code = row["sic_code"]
                
                if item_code in old_data:
                    old_bin = old_data[item_code]["bin"]
                    if new_bin and old_bin and new_bin != old_bin:
                        quality_movements.append({"item_code": item_code, "bin": new_bin, "sic": sic_code})

                items.append(MasterItem(
                    item_code=item_code,
                    description=row["description"],
                    abc_code=row["abc_code"],
                    sic_code=row["sic_code"],
                    bin_1=new_bin,
                    additional_bin=row["additional_bin"],
                    physical_qty=row["physical_qty"] or 0.0,
                    frozen_qty=row["frozen_qty"] or 0.0,
                    weight_per_unit=row["weight_per_unit"] or 0.0,
                    xdock_pending=row["xdock_pending"] or 0
                ))
            session.add_all(items)
        await session.commit()

    # 3. PROCESAR APRENDIZAJE DE IA (En una sesión totalmente nueva)
    if quality_movements:
        try:
            async with async_session() as ai_session:
                # Obtener layout para validar calidad de forma directa de SQL
                res_bins = await ai_session.execute(select(BinLocation.bin_code, BinLocation.score))
                storage_scores = {b[0]: b[1] for b in res_bins.all()}
                
                learned_count = 0
                for move in quality_movements:
                    physical_score = storage_scores.get(move["bin"].upper(), 0)
                    
                    # FILTRO DE CALIDAD: Score >= 6
                    if physical_score >= 6:
                        await ai_slotting.learn_from_decision(ai_session, move["item_code"], move["bin"], move["sic"])
                        learned_count += 1
                
                if learned_count > 0:
                    print(f"🧠 IA: Aprendidos {learned_count} patrones de movimiento de alta calidad.")
        except Exception as ai_err:
            print(f"⚠️ Error no crítico en aprendizaje IA: {ai_err}")

    print(f"Cargados {len(df_clean)} items al maestro.")

async def load_layout_data(xlsx_path: str):
    """Carga el layout del almacén desde el Excel layout_almacen.xlsx"""
    if not os.path.exists(xlsx_path):
        print(f"Archivo no encontrado: {xlsx_path}")
        return

    try:
        # Leer Excel
        df = pl.read_excel(xlsx_path)
        
        # Mapeo de columnas reales del Excel a nuestro modelo
        column_mapping = {
            "BIN": "bin_code",
            "ZONA": "zone",
            "NIVEL": "level",
            "PASILLO": "aisle",
            "SPOT": "spot",
            "SCORE": "score"
        }
        
        # Renombrar solo las que existan
        available_renames = {old: new for old, new in column_mapping.items() if old in df.columns}
        df = df.rename(available_renames)
        
        # Filtrar filas donde bin_code sea nulo o vacío
        df = df.filter(pl.col("bin_code").is_not_null())
        df = df.with_columns(pl.col("bin_code").cast(pl.Utf8).str.strip_chars())
        df = df.filter(pl.col("bin_code") != "")
        
        # Eliminar duplicados de bin_code
        df = df.unique(subset=["bin_code"])

        async with async_session() as session:
            async with session.begin():
                await session.execute(delete(BinLocation))
                
                bins = []
                for row in df.to_dicts():
                    bins.append(BinLocation(
                        bin_code=row["bin_code"].upper(),
                        zone=str(row.get("zone", "Rack")),
                        level=int(row.get("level", 0)),
                        aisle=str(row.get("aisle", "N/A")),
                        spot=str(row.get("spot", "Cold")),
                        score=int(row.get("score", 0))
                    ))
                session.add_all(bins)
            await session.commit()
        print(f"Cargados {len(df)} bins al layout con scoring físico.")
    except Exception as e:
        print(f"Error cargando layout: {e}")

async def run_initial_load():
    """Ejecuta la carga inicial de todos los datos base."""
    print("Iniciando carga de datos base...")
    await load_master_data("datos/AURRSGLBD0250 - Item Stockroom Balance.xlsx")
    await load_layout_data("datos/layout_almacen.xlsx")
    print("Carga finalizada.")
