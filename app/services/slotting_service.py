import orjson
import os

from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.sql_models import MasterItem, Log, BinLocation, SlottingRule
from app.core.config import SLOTTING_PARAMS_PATH

class SlottingService:
    def __init__(self):
        self.params_path = SLOTTING_PARAMS_PATH

    def get_sic_code_by_hits(self, hits: int) -> str:
        """Categoriza un ítem basándose en su frecuencia de movimiento (Hits)."""
        if hits > 30: return 'W'
        if hits >= 11: return 'X'
        if hits >= 7: return 'Y'
        if hits >= 5: return 'K'
        if hits >= 3: return 'L'
        if hits >= 1: return 'Z'
        return '0'

    async def _get_item_hits(self, db: AsyncSession, item_code: str, days: int = 90) -> int:
        """Obtiene el conteo de movimientos históricos para un ítem."""
        import datetime
        try:
            # Buscamos en logs de los últimos N días
            since_date = (datetime.datetime.now() - datetime.timedelta(days=days)).isoformat()
            stmt = select(func.count(Log.id)).where(and_(Log.itemCode == item_code, Log.timestamp >= since_date))
            res = await db.execute(stmt)
            return res.scalar() or 0
        except: return 0

    async def _get_layout_config(self, db: AsyncSession) -> Dict[str, Any]:
        """Obtiene la configuración del layout con prioridad en SQL y fallback en JSON."""
        # 1. Intentar obtener de SQL (Ubicaciones)
        res_bins = await db.execute(select(BinLocation))
        bins_sql = res_bins.scalars().all()
        
        storage = {}
        if bins_sql:
            storage = {b.bin_code: {
                "zone": b.zone, 
                "aisle": b.aisle, 
                "level": b.level, 
                "spot": b.spot,
                "score": b.score
            } for b in bins_sql}
        
        # 2. Intentar obtener de SQL (Reglas de Rotación)
        res_rules = await db.execute(select(SlottingRule))
        rules_sql = res_rules.scalars().all()
        
        turnover = {}
        if rules_sql:
            turnover = {r.sic_code: {"range": r.description, "spot": r.ideal_spot} for r in rules_sql}

        # 3. Fallback al JSON (Si falta algo o todo)
        mix_limits = {"minuteria_max_skus": 3, "nivel2_max_skus": 6, "otros_niveles_max_skus": 4}
        zone_rules = {
            "cantilever_keywords": "ROD, INTEGRAL STEEL",
            "minuteria_weight_max": 0.1,
            "minuteria_zone": "Minuteria",
            "heavy_weight_min": 10,
            "heavy_levels": "3, 4, 5",
            "high_rotation_levels": "0, 1",
            "default_levels": "2"
        }
        if os.path.exists(self.params_path):
            try:
                with open(self.params_path, 'rb') as f:
                    config = orjson.loads(f.read())
                    if not storage:
                        storage = config.get("storage", {})
                    if not turnover:
                        turnover = config.get("turnover", {})
                    saved_limits = config.get("mix_limits", {})
                    if saved_limits:
                        mix_limits.update(saved_limits)
                    saved_zone_rules = config.get("zone_rules", {})
                    if saved_zone_rules:
                        zone_rules.update(saved_zone_rules)
            except: pass
            
        return {"storage": storage, "turnover": turnover, "mix_limits": mix_limits, "zone_rules": zone_rules}

    async def get_suggested_bin(self, db: AsyncSession, item_details: Dict[str, Any]) -> Optional[str]:
        """Calcula la mejor ubicación disponible basada en el mapa de slotting, reglas de negocio y scoring físico."""
        config = await self._get_layout_config(db)
        storage = config.get('storage', {})
        turnover_map = config.get('turnover', {})
        
        current_bin = str(item_details.get('Bin_1', '')).strip().upper()
        item_code = str(item_details.get('Item_Code', '')).strip()

        # Prioridad 1: Confiar en la clasificación oficial del Maestro (ERP)
        sic_code = str(item_details.get('SIC_Code_stockroom', '')).strip().upper()

        # Prioridad 2 (Fallback): Si el ERP no mandó SIC Code (vacío o '0'), intentar deducirlo por actividad local
        if not sic_code or sic_code == '0' or sic_code == 'N/A':
            hits = await self._get_item_hits(db, item_code)
            sic_code = self.get_sic_code_by_hits(hits)
            
        if not sic_code: sic_code = '0'

        # Determinar el spot ideal basado en el SIC Code
        ideal_spot = turnover_map.get(sic_code, {}).get('spot', 'cold').lower()
        if sic_code in ['W', 'X', 'Y']: ideal_spot = 'hot'
        elif sic_code in ['K', 'L', 'Z', '0']: ideal_spot = 'cold'

        # --- REUBICACIÓN PROACTIVA V2 ---
        if current_bin in storage:
            current_info = storage[current_bin]
            current_spot = str(current_info.get('spot', 'cold')).lower()
            current_score = current_info.get('score', 0)
            
            # Regla de expulsión estricta para BAJA ROTACIÓN (0, Z, L):
            # Si están en bin bueno (>3), se tienen que ir al rincón.
            if sic_code in ['0', 'Z', 'L']:
                if current_score <= 3 and current_spot == 'cold':
                    return None
            else:
                # Regla estándar: Si el spot es correcto y el score físico es bueno (>=8), se queda
                if current_spot == ideal_spot:
                    if ideal_spot == 'cold' or current_score >= 8:
                        return None

        occupancy_data = await self._get_bins_occupancy(db)
        
        target_zone = None
        target_levels = None
        description = str(item_details.get('Item_Description', '')).upper()
        
        weight = 0.0
        try:
            weight_val = item_details.get('Weight_per_Unit', '0')
            weight = float(str(weight_val).replace(',', '')) if weight_val else 0.0
        except: pass

        # --- REGLAS DE NEGOCIO POR ATRIBUTOS ---
        zone_rules = config.get('zone_rules', {})
        minuteria_weight_max = float(zone_rules.get('minuteria_weight_max', 0.2))
        minuteria_zone = zone_rules.get('minuteria_zone', 'Minuteria')
        heavy_weight_min = float(zone_rules.get('heavy_weight_min', 10))
        heavy_levels = self._parse_levels(zone_rules.get('heavy_levels', '3, 4, 5'))
        high_rotation_levels = self._parse_levels(zone_rules.get('high_rotation_levels', '0, 1'))
        default_levels = self._parse_levels(zone_rules.get('default_levels', '2'))
        
        # Palabras clave dinámicas para Cantilever
        cantilever_keywords = [kw.strip().upper() for kw in str(zone_rules.get('cantilever_keywords', 'ROD, INTEGRAL STEEL')).split(',') if kw.strip()]
        is_cantilever = any(kw in description for kw in cantilever_keywords)

        if is_cantilever:
            target_zone = "Cantilever"
        elif 0 < weight < minuteria_weight_max:
            target_zone = minuteria_zone
        elif weight > heavy_weight_min:
            target_zone = "Rack"
            target_levels = heavy_levels
        elif sic_code in ['W', 'X']:
            target_zone = "Rack"
            target_levels = high_rotation_levels
        else:
            target_zone = "Rack"
            target_levels = default_levels
        
        forbidden_zones = ["Cantilever", "Minuteria"] if target_zone is None else []

        # --- BÚSQUEDA DE CANDIDATOS V2 ---
        candidates = []
        for bin_code, info in storage.items():
            zone = info.get('zone')
            level = info.get('level')
            spot = str(info.get('spot', 'Cold')).lower()
            physical_score = info.get('score', 0)
            
            # --- REGLA MAESTRA DE EXILIO (SIC 0, Z, L) ---
            if sic_code in ['0', 'Z', 'L']:
                # 1. Filtro base de eficiencia: Solo bines muertos (Score <= 3 y Cold)
                if physical_score > 3 or spot != 'cold':
                    continue
                
                # 2. Restricción Estricta de Nivel para Rack en Exilio (Solo 2 o 3)
                if zone == 'Rack' and level not in [2, 3]:
                    continue
                
                # 3. Preferencia de Zona por Peso para Exilio
                if weight < 0.1:
                    # Ligeros: Preferencia Minutería (pero aceptamos Rack L2/3 como fallback)
                    pass 
                else:
                    # Pesados/Medios: Obligatorio Rack (ya filtrado niveles 2/3 arriba)
                    if zone != 'Rack':
                        continue
            else:
                # Reglas estándar para items con actividad
                if zone in forbidden_zones: continue
                if target_zone and zone != target_zone: continue
                if target_levels and level not in target_levels: continue

            # Obtener datos de ocupación y afinidad
            bin_data = occupancy_data.get(bin_code.upper(), {"count": 0, "sics": set()})
            current_items = bin_data["count"]
            bin_sics = bin_data["sics"]
            
            # AFINIDAD: Si el bin ya tiene este SIC, gana puntos extra
            affinity_score = 10 if sic_code in bin_sics else 0
            
            # Límites de mezcla
            mix_limits = config.get('mix_limits', {})
            limit = mix_limits.get('minuteria_max_skus', 3) if zone == "Minuteria" else (mix_limits.get('nivel2_max_skus', 6) if level == 2 else mix_limits.get('otros_niveles_max_skus', 4))
            
            if current_items < limit:
                # Puntaje de Prioridad de Zona (para el exilio dinámico)
                zone_priority = 0
                if sic_code in ['0', 'Z', 'L']:
                    if weight < 0.1:
                        # Para ligeros, preferimos Minutería sobre Rack
                        zone_priority = 10 if zone == 'Minuteria' else 5
                    else:
                        zone_priority = 10 # Ya filtramos arriba que sea Rack L2/3

                candidates.append({
                    'bin': bin_code,
                    'occupancy': current_items,
                    'spot': spot,
                    'score': physical_score,
                    'affinity': affinity_score,
                    'zone_priority': zone_priority
                })

        if not candidates: return "SIN_ESPACIO"

        # Filtrar por afinidad de spot (Hot items en Hot spots)
        matches = [c for c in candidates if c['spot'] == ideal_spot]
        if matches: candidates = matches

        # ORDENAMIENTO V3 (Con Matriz de Prioridad):
        # 1. Mayor Prioridad de Zona (Exilio)
        # 2. Mayor Score Físico (En exilio esto es poco relevante pero ordena 3 > 0)
        # 3. Mayor Afinidad SIC
        # 4. Mayor Ocupación (Llenado Compacto)
        candidates.sort(key=lambda x: (-x.get('zone_priority', 0), -x['score'], -x['affinity'], -x['occupancy']))
        
        return candidates[0]['bin']

    async def _get_bins_occupancy(self, db: AsyncSession) -> Dict[str, Dict[str, Any]]:
        """Calcula ocupación y familia (SICs) por bin."""
        occupancy = {}
        try:
            # 1. Master Items (Stock físico actual)
            master_stmt = select(MasterItem.bin_1, MasterItem.sic_code).where(MasterItem.physical_qty > 0)
            master_res = await db.execute(master_stmt)
            for bin_code, sic in master_res.all():
                if bin_code:
                    code = str(bin_code).strip().upper()
                    if code not in occupancy: occupancy[code] = {"count": 0, "sics": set()}
                    occupancy[code]["count"] += 1
                    if sic: occupancy[code]["sics"].add(str(sic).strip().upper())

            # 2. Logs Activos (Mercancía en camino)
            logs_stmt = select(Log.relocatedBin, MasterItem.sic_code).join(MasterItem, Log.itemCode == MasterItem.item_code).where(and_(Log.archived_at == None, Log.relocatedBin != '', Log.relocatedBin != None))
            logs_res = await db.execute(logs_stmt)
            for bin_code, sic in logs_res.all():
                if bin_code:
                    code = str(bin_code).strip().upper()
                    if code not in occupancy: occupancy[code] = {"count": 0, "sics": set()}
                    occupancy[code]["count"] += 1
                    if sic: occupancy[code]["sics"].add(str(sic).strip().upper())
        except Exception as e:
            print(f"Error calculando ocupación: {e}")
        return occupancy

    async def get_occupancy_report(self, db: AsyncSession) -> Dict[str, Any]:
        """Genera el reporte de métricas del mapa de slotting."""
        occupancy_data = await self._get_bins_occupancy(db)
        config = await self._get_layout_config(db)
        storage = config.get('storage', {})
        
        zones_by_items = {}
        aisles_by_items = {}
        total_items = 0
        
        report = {
            "summary": {
                "total_bins": len(storage), 
                "filled_bins": 0, 
                "available_bins": 0,
                "occupancy_pct": 0,
                "total_items": 0,
                "avg_items_per_bin": 0
            },
            "zones": {},
            "analytics": {
                "zones_by_items": {},
                "top_aisles": {}
            }
        }
        
        for bin_code, info in storage.items():
            zone = info.get('zone', 'Unknown')
            level = info.get('level', 0)
            aisle = info.get('aisle', 'N/A')
            
            if zone not in report["zones"]:
                report["zones"][zone] = {"total": 0, "occupied": 0, "levels": {}}
            
            if level not in report["zones"][zone]["levels"]:
                report["zones"][zone]["levels"][level] = {"total": 0, "occupied_skus": 0, "full_bins": 0}
            
            report["zones"][zone]["total"] += 1
            report["zones"][zone]["levels"][level]["total"] += 1
            
            bin_stats = occupancy_data.get(bin_code.upper(), {"count": 0})
            current_skus = bin_stats["count"]
            limit = 3 if zone == "Minuteria" else 4
            
            if current_skus > 0:
                report["zones"][zone]["occupied"] += 1
                report["summary"]["filled_bins"] += 1
                report["zones"][zone]["levels"][level]["occupied_skus"] += current_skus
                total_items += current_skus
                
                zones_by_items[zone] = zones_by_items.get(zone, 0) + current_skus
                if aisle != 'N/A':
                    aisles_by_items[aisle] = aisles_by_items.get(aisle, 0) + current_skus

                if current_skus >= limit:
                    report["zones"][zone]["levels"][level]["full_bins"] += 1
            else:
                report["summary"]["available_bins"] += 1
        
        report["summary"]["total_items"] = total_items
        if report["summary"]["total_bins"] > 0:
            report["summary"]["occupancy_pct"] = round((report["summary"]["filled_bins"] / report["summary"]["total_bins"]) * 100, 1)
            report["summary"]["avg_items_per_bin"] = round(total_items / report["summary"]["filled_bins"], 1) if report["summary"]["filled_bins"] > 0 else 0

        report["analytics"]["zones_by_items"] = dict(sorted(zones_by_items.items(), key=lambda x: x[1], reverse=True)[:5])
        report["analytics"]["top_aisles"] = dict(sorted(aisles_by_items.items(), key=lambda x: x[1], reverse=True)[:5])
        report["analytics"]["bins_by_zone"] = {z: data["total"] for z, data in report["zones"].items()}
        report["analytics"]["bins_by_zone"] = dict(sorted(report["analytics"]["bins_by_zone"].items(), key=lambda x: x[1], reverse=True))
                
        return report

    async def update_config(self, db: AsyncSession, payload: Dict[str, Any]) -> Dict[str, str]:
        """Persiste los cambios de configuración: turnover en DB, mix_limits en JSON."""
        # 1. Actualizar reglas de rotación en la DB
        turnover = payload.get('turnover', {})
        if turnover:
            for sic_code, info in turnover.items():
                stmt = select(SlottingRule).where(SlottingRule.sic_code == sic_code)
                res = await db.execute(stmt)
                existing = res.scalar_one_or_none()
                if existing:
                    existing.ideal_spot = info.get('spot', existing.ideal_spot)
                    existing.description = info.get('range', existing.description)
                else:
                    new_rule = SlottingRule(
                        sic_code=sic_code,
                        ideal_spot=info.get('spot', 'cold'),
                        description=info.get('range', '')
                    )
                    db.add(new_rule)
            await db.commit()

        # 2. Actualizar mix_limits y zone_rules en el JSON
        mix_limits = payload.get('mix_limits', {})
        zone_rules = payload.get('zone_rules', {})
        if (mix_limits or zone_rules) and os.path.exists(self.params_path):
            try:
                with open(self.params_path, 'rb') as f:
                    config = orjson.loads(f.read())
                if mix_limits:
                    config['mix_limits'] = mix_limits
                if zone_rules:
                    config['zone_rules'] = zone_rules
                with open(self.params_path, 'wb') as f:
                    f.write(orjson.dumps(config, option=orjson.OPT_INDENT_2))
            except Exception as e:
                return {"message": f"Error actualizando JSON: {e}"}

        return {"message": "Configuración actualizada correctamente"}

    @staticmethod
    def _parse_levels(levels_str: str) -> List[int]:
        """Convierte una cadena como '3, 4, 5' en una lista [3, 4, 5]."""
        try:
            return [int(x.strip()) for x in str(levels_str).split(',') if x.strip().isdigit()]
        except:
            return [2]

slotting_service = SlottingService()
