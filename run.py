import uvicorn
import os

if __name__ == "__main__":
    # Asegurarse de que el directorio de datos existe
    os.makedirs("static/json", exist_ok=True)
    
    print("Iniciando Servidor de Slotting...")
    print("Documentación disponible en: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
