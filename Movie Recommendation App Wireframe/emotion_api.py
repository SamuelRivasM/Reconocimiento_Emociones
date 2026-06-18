import base64
import cv2
import numpy as np
import requests  # <--- Asegúrate de tenerlo (si no, pip install requests)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace

app = FastAPI(title="MovieFlix Emotion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapeo oficial de IDs de Géneros de TMDB
EMOTION_TO_GENRES = {
    "happy":    "35,16,12",   # Comedia, Animación, Aventura
    "sad":      "18,10749",   # Drama, Romance
    "angry":    "28,53",      # Acción, Thriller
    "fear":     "27,9648",    # Terror, Misterio
    "surprise": "878,14",     # Ciencia ficción, Fantasía
    "disgust":  "99,80",      # Documental, Crimen
    "neutral":  "10751,35",   # Familia, Comedia
}

class ImageRequest(BaseModel):
    image: str

@app.post("/analyze")
async def analyze_emotion(request: ImageRequest):
    try:
        # 1. Decodificar Imagen
        encoded_data = request.image
        if "," in encoded_data:
            encoded_data = encoded_data.split(",", 1)[1]

        img_bytes = base64.b64decode(encoded_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Error de imagen.")

        # 2. Análisis DeepFace
        results = DeepFace.analyze(frame, actions=["emotion"], enforce_detection=False, detector_backend="opencv", silent=True)
        result = results[0] if isinstance(results, list) else results
        dominant_emotion = result["dominant_emotion"]

        # CONVERSIÓN DE NUMEROS NUMPY A FLOATS
        cleaned_emotions = {emo: float(val) for emo, val in result["emotion"].items()}

        # 3. CONEXIÓN GLOBAL: Consultar a TMDB en tiempo real por internet
        # Usamos un token de acceso público de TMDB para traer películas reales en español
        genre_ids = EMOTION_TO_GENRES.get(dominant_emotion, "35")
        tmdb_url = f"https://api.themoviedb.org/3/discover/movie?api_key=ca1483b8d4f40f09707b6bfda93979bb&with_genres={genre_ids}&language=es-MX&sort_by=popularity.desc"
        
        tmdb_response = requests.get(tmdb_url).json()
        raw_movies = tmdb_response.get("results", [])[:3] # Tomamos las 3 mejores del mundo real

        # Formateamos las películas globales para que React las entienda directo
        global_recommendations = []
        for movie in raw_movies:
            global_recommendations.append({
                "id": movie.get("id"),
                "title": movie.get("title"),
                "description": movie.get("overview"),
                "image": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}", # Poster real de los servidores de TMDB
                "rating": movie.get("vote_average"),
                "year": movie.get("release_date", "2026")[:4],
                "genre": "Recomendación Global"
            })

        return {
            "success": True,
            "dominant_emotion": dominant_emotion,
            "all_emotions": cleaned_emotions,
            "movies": global_recommendations  # <--- AQUÍ VAN LAS PELIS REALES DE INTERNET
        }

    except Exception as e:
        return {"success": False, "error": str(e), "dominant_emotion": "neutral", "movies": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)