#!/bin/bash

# Script para ejecutar la aplicación de Slotting
echo "🚀 Iniciando aplicación de Slotting..."

# Verificar si el entorno virtual existe
if [ ! -d "venv" ]; then
    echo "❌ Error: El entorno virtual 'venv' no existe."
    echo "Por favor, ejecuta primero la instalación de dependencias."
    exit 1
fi

# Activar el entorno virtual e iniciar la aplicación
source venv/bin/activate
python3 run.py
