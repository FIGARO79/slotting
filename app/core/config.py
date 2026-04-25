import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent

# Rutas de archivos JSON
STATIC_PATH = PROJECT_ROOT / "static" / "json"
STATIC_PATH.mkdir(parents=True, exist_ok=True)

SLOTTING_PARAMS_PATH = STATIC_PATH / "slotting_parameters.json"
AI_SLOTTING_MEMORY_PATH = STATIC_PATH / "ai_slotting_memory.json"
PLANNER_CONFIG_PATH = STATIC_PATH / "planner_config.json"
PLANNER_DATA_PATH = STATIC_PATH / "planner_data.json"

# Base de datos (SQLite para portabilidad fácil)
DATABASE_URL = "sqlite+aiosqlite:///./slotting.db"
