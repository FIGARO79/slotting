import polars as pl
import os
import asyncio
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sql_models import MasterItem, BinLocation
from app.core.db import async_session

async def load_master_data(csv_path: str):
    """Carga el maestro de inventario desde el CSV AURRSGLBD0250.csv"""
    if not os.path.exists(csv_path):
        print(f"Archivo no encontrado: {csv_path}")
        return

    # Leer CSV con Polars
    df = pl.read_csv(csv_path, infer_schema_length=10000, ignore_errors=True)
    
    # Renombrar columnas para que coincidan con el modelo
    # Basado en el head: Item_Code, Item_Description, ABC_Code_stockroom, SIC_Code_stockroom, Bin_1, Aditional_Bin_Location, Physical_Qty, Weight_per_Unit, Frozen_Qty
    df_clean = df.select([
        pl.col("Item_Code").cast(pl.Utf8),
        pl.col("Item_Description").alias("description").cast(pl.Utf8),
        pl.col("ABC_Code_stockroom").alias("abc_code").cast(pl.Utf8),
        pl.col("SIC_Code_stockroom").alias("sic_code").cast(pl.Utf8),
        pl.col("Bin_1").cast(pl.Utf8),
        pl.col("Aditional_Bin_Location").alias("additional_bin").cast(pl.Utf8),
        pl.col("Physical_Qty").alias("physical_qty").cast(pl.Float64),
        pl.col("Frozen_Qty").alias("frozen_qty").cast(pl.Float64),
        pl.col("Weight_per_Unit").alias("weight_per_unit").cast(pl.Float64),
        pl.col("Reserved_Qty").alias("xdock_pending").cast(pl.Int64)
    ]).unique(subset=["Item_Code"])

    async with async_session() as session:
        async with session.begin():
            # Limpiar tabla actual
            await session.execute(delete(MasterItem))
            
            # Insertar nuevos registros (por lotes para eficiencia)
            items = []
            for row in df_clean.to_dicts():
                items.append(MasterItem(
                    item_code=str(row["Item_Code"]).strip(),
                    description=row["description"],
                    abc_code=row["abc_code"],
                    sic_code=row["sic_code"],
                    bin_1=row["Bin_1"],
                    additional_bin=row["additional_bin"],
                    physical_qty=row["physical_qty"] or 0.0,
                    frozen_qty=row["frozen_qty"] or 0.0,
                    weight_per_unit=row["weight_per_unit"] or 0.0,
                    xdock_pending=row["xdock_pending"] or 0
                ))
            session.add_all(items)
        await session.commit()
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
        # Columnas detectadas: ['BIN', 'ZONA', 'PASILLO', 'NIVEL', 'SPOT']
        column_mapping = {
            "BIN": "bin_code",
            "ZONA": "zone",
            "NIVEL": "level",
            "PASILLO": "aisle",
            "SPOT": "spot"
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
                        spot=str(row.get("spot", "Cold"))
                    ))
                session.add_all(bins)
            await session.commit()
        print(f"Cargados {len(df)} bins al layout.")
    except Exception as e:
        print(f"Error cargando layout: {e}")

async def run_initial_load():
    """Ejecuta la carga inicial de todos los datos base."""
    print("Iniciando carga de datos base...")
    await load_master_data("datos/AURRSGLBD0250.csv")
    await load_layout_data("datos/layout_almacen.xlsx")
    print("Carga finalizada.")
