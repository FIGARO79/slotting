#!/bin/bash

# Script para ejecutar la aplicacion de Slotting
echo "Iniciando aplicacion de Slotting..."

# Verificar si el entorno virtual existe
if [ ! -d "venv" ]; then
    echo "Error: El entorno virtual 'venv' no existe."
    echo "Por favor, ejecuta primero la instalacion de dependencias."
    exit 1
fi

# Activar el entorno virtual e iniciar la aplicacion
source venv/bin/activate
python3 run.py
