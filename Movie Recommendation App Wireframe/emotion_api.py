import base64
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace

# Inicializar la app
app = FastAPI(title="MovieFlix Emotion API")

# Configurar CORS para que React (Vite) pueda hacer peticiones sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo permite cualquier origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diccionario de géneros que ya definiste en emotion_to_genre.py
EMOTION_TO_GENRES = {
    "happy":    [35, 16, 12],     # Comedia, Animación, Aventura
    "sad":      [18, 10749],      # Drama, Romance
    "angry":    [28, 53],         # Acción, Thriller
    "fear":     [27, 9648],       # Terror, Misterio
    "surprise": [878, 14],        # Ciencia ficción, Fantasía
    "disgust":  [99, 80],         # Documental, Crimen
    "neutral":  [10751, 35],      # Familia, Comedia
}

# Modelo de datos que espera recibir la API (La foto de la webcam en Base64)
class ImageRequest(BaseModel):
    image: str

@app.post("/analyze")
async def analyze_emotion(request: ImageRequest):
    try:
        # 1. Limpiar el prefijo data:image/png;base64, si viene del frontend
        encoded_data = request.image
        if "," in encoded_data:
            encoded_data = encoded_data.split(",", 1)[1]

        # 2. Decodificar la cadena Base64 a bytes de imagen
        img_bytes = base64.b64decode(encoded_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="No se pudo procesar la imagen enviada.")

        # 3. Analizar con DeepFace (enforce_detection=False evita que muera si no hay rostro)
        results = DeepFace.analyze(
            frame,
            actions=["emotion"],
            enforce_detection=False,
            detector_backend="opencv",
            silent=True
        )
        
        result = results[0] if isinstance(results, list) else results
        dominant_emotion = result["dominant_emotion"]

        # CONVERSIÓN CRÍTICA: Convertimos los tipos de numpy a floats puros de Python
        cleaned_emotions = {
            emo: float(val) for emo, val in result["emotion"].items()
        }

        # Obtener los IDs de géneros correspondientes
        suggested_genres = EMOTION_TO_GENRES.get(dominant_emotion, [10751, 35])

        # Devolvemos el JSON con las emociones ya limpias y legibles
        return {
            "success": True,
            "dominant_emotion": dominant_emotion,
            "suggested_genres": suggested_genres,
            "all_emotions": cleaned_emotions  # <--- Usamos el diccionario corregido aquí
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "dominant_emotion": "neutral",
            "suggested_genres": EMOTION_TO_GENRES["neutral"]
        }

if __name__ == "__main__":
    import uvicorn
    # Cambia el host a "0.0.0.0"
    uvicorn.run(app, host="0.0.0.0", port=5000)