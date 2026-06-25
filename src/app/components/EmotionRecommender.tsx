import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

// Interfaces para TypeScript según la respuesta de tu API de FastAPI (Python)
interface ApiResponse {
    success: boolean;
    dominant_emotion: string;
    suggested_genres: number[];
    all_emotions?: Record<string, number>;
    error?: string;
}

interface EmotionRecommenderProps {
    // Callback para enviarle los IDs de géneros detectados al componente padre (App.tsx)
    onEmotionDetected: (genres: number[], emotion: string) => void;
}

export const EmotionRecommender: React.FC<EmotionRecommenderProps> = ({ onEmotionDetected }) => {
    const webcamRef = useRef<Webcam>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
    const [genres, setGenres] = useState<number[]>([]);

    // Configuración de la resolución de la webcam en el navegador
    const videoConstraints = {
        width: 640,
        height: 480,
        facingMode: "user"
    };

    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current) return;

        // 1. Obtener el screenshot actual de la cámara en formato Base64
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            alert("No se pudo acceder a la cámara. Verifica los permisos de tu navegador.");
            return;
        }

        setLoading(true);
        setDetectedEmotion(null);

        try {
            // 2. Enviar el Base64 al microservicio de Python (Puerto 5000)
            const response = await fetch("http://127.0.0.1:5000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ image: imageSrc }),
            });

            const data: ApiResponse = await response.json();

            if (data.success) {
                setDetectedEmotion(data.dominant_emotion);
                setGenres(data.suggested_genres);

                // 3. Notificar a App.tsx para que busque las películas en Node.js + SQLite
                onEmotionDetected(data.suggested_genres, data.dominant_emotion);
            } else {
                console.error("Error en el análisis de IA:", data.error);
                setDetectedEmotion("No detectado");
                alert("La IA no pudo detectar un rostro claramente. ¡Inténtalo de nuevo!");
            }
        } catch (err) {
            console.error("Error de conexión con el microservicio Python:", err);
            alert("¡Opa! Asegúrate de que el servidor de Python (emotion_api.py) esté corriendo en el puerto 5000.");
        } finally {
            setLoading(false);
        }
    }, [webcamRef, onEmotionDetected]);

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl max-w-md mx-auto">
            <div className="text-center">
                <h3 className="text-xl font-bold text-white tracking-wide">Tu Cámara Inteligente</h3>
                <p className="text-xs text-zinc-400 mt-1">Analizaremos tu expresión para recomendarte qué ver</p>
            </div>

            {/* Contenedor de la Webcam con efecto moderno */}
            <div className="relative rounded-lg overflow-hidden border-2 border-zinc-800 bg-zinc-900 w-[320px] h-[240px] md:w-[400px] md:h-[300px] flex items-center justify-center">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                />

                {/* Overlay de carga con animación cuando la IA procesa la foto */}
                {loading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center gap-3 text-white backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-t-red-600 border-zinc-700 rounded-full animate-spin"></div>
                        <span className="text-sm font-medium tracking-wide animate-pulse">Escaneando gestos...</span>
                    </div>
                )}
            </div>

            {/* Botón interactivo estilo MovieFlix */}
            <button
                onClick={captureAndAnalyze}
                disabled={loading}
                className={`w-full py-2.5 px-5 font-bold tracking-wide rounded-md transition-all duration-200 
          ${loading
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-md shadow-red-900/20"
                    }`}
            >
                {loading ? "Procesando Rostro..." : "📸 ESCANEAR MI ÁNIMO"}
            </button>

            {/* Caja de resultados dinámicos */}
            {detectedEmotion && (
                <div className="w-full mt-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 text-center animate-fade-in">
                    <p className="text-sm text-zinc-300">
                        Estado de ánimo: <span className="font-bold text-yellow-400 uppercase tracking-wider">{detectedEmotion}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                        Filtros TMDB aplicados: {JSON.stringify(genres)}
                    </p>
                </div>
            )}
        </div>
    );
};