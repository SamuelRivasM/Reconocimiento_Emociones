"""
INTENTO DE DETECTOR DE EMOCIONES | INTERACCIÓN HOMBRE - MÁQUINA :V

INSTALACIÓN (ejecutar antes):
    pip install deepface opencv-python tf-keras

USO (ejecución):
    python [Nombre-de-archivoxd].py

TECLAS A USAR DURANTE LA EJECUCIÓN:
    Q  → Salir
    S  → Guardar captura de pantalla
    P  → Pausar o Reanudar detección
"""

import cv2
import numpy as np
from deepface import DeepFace
import time
import os
from datetime import datetime

# ── CONFIGURACIÓN ──────────────────────────────────────────────────────────────

CAMERA_INDEX   = 0        # 0 = cámara principal, 1 = cámara secundaria
ANALYZE_EVERY  = 8        # Analizar cada N frames (mayor = más rápido pero menos preciso)
SHOW_ALL_BARS  = True     # Mostrar barras de todas las emociones
LANGUAGE       = "es"     # Idioma de emociones: "es" (español) o "en" (inglés)

# ── TRADUCCIONES ───────────────────────────────────────────────────────────────

EMOTION_LABELS = {
    "es": {
        "happy":     ":D Happy",
        "sad":       "D: Sad",
        "angry":     ">:V Angry",
        "fear":      "D:> Fearful",
        "surprise":  ":O Surprised",
        "disgust":   "UGH Disgusted",
        "neutral":   "-_- Neutral",
    },
    "en": {
        "happy":     ":D Happy",
        "sad":       "D: Sad",
        "angry":     ">:V Angry",
        "fear":      "D:> Fearful",
        "surprise":  ":O Surprised",
        "disgust":   "UGH Disgusted",
        "neutral":   "-_- Neutral",
    }
}

EMOTION_COLORS = {
    "happy":    (0,   220, 100),   # Verde brillante
    "sad":      (200,  80,  50),   # Azul oscuro
    "angry":    (0,    40, 220),   # Rojo
    "fear":     (130,  0,  180),   # Púrpura
    "surprise": (0,   200, 220),   # Cyan
    "disgust":  (30,  150,  30),   # Verde oscuro
    "neutral":  (160, 160, 160),   # Gris
}

LABELS = EMOTION_LABELS.get(LANGUAGE, EMOTION_LABELS["es"])

# ── UTILIDADES DE DIBUJO ───────────────────────────────────────────────────────

def draw_rounded_rect(img, pt1, pt2, color, thickness, radius=10):
    """Dibuja un rectángulo con esquinas redondeadas."""
    x1, y1 = pt1
    x2, y2 = pt2
    r = min(radius, (x2 - x1) // 2, (y2 - y1) // 2)
    cv2.line(img,  (x1 + r, y1),     (x2 - r, y1),     color, thickness)
    cv2.line(img,  (x1 + r, y2),     (x2 - r, y2),     color, thickness)
    cv2.line(img,  (x1,     y1 + r), (x1,     y2 - r), color, thickness)
    cv2.line(img,  (x2,     y1 + r), (x2,     y2 - r), color, thickness)
    cv2.ellipse(img, (x1 + r, y1 + r), (r, r), 180,  0, 90,  color, thickness)
    cv2.ellipse(img, (x2 - r, y1 + r), (r, r), 270,  0, 90,  color, thickness)
    cv2.ellipse(img, (x1 + r, y2 - r), (r, r),  90,  0, 90,  color, thickness)
    cv2.ellipse(img, (x2 - r, y2 - r), (r, r),   0,  0, 90,  color, thickness)


def filled_rounded_rect(img, pt1, pt2, color, radius=10, alpha=1.0):
    """Dibuja un rectángulo relleno semi-transparente con esquinas redondeadas."""
    overlay = img.copy()
    x1, y1 = pt1
    x2, y2 = pt2
    r = min(radius, (x2 - x1) // 2, (y2 - y1) // 2)
    cv2.rectangle(overlay, (x1 + r, y1), (x2 - r, y2), color, -1)
    cv2.rectangle(overlay, (x1, y1 + r), (x2, y2 - r), color, -1)
    cv2.circle(overlay, (x1 + r, y1 + r), r, color, -1)
    cv2.circle(overlay, (x2 - r, y1 + r), r, color, -1)
    cv2.circle(overlay, (x1 + r, y2 - r), r, color, -1)
    cv2.circle(overlay, (x2 - r, y2 - r), r, color, -1)
    if alpha < 1.0:
        cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
    else:
        img[:] = overlay[:]


def put_text_with_shadow(img, text, pos, font, scale, color, thickness=1):
    """Escribe texto con sombra para mejor legibilidad."""
    x, y = pos
    cv2.putText(img, text, (x+1, y+1), font, scale, (0, 0, 0),    thickness + 1, cv2.LINE_AA)
    cv2.putText(img, text, (x,   y),   font, scale, color,          thickness,     cv2.LINE_AA)


# ── CLASE PRINCIPAL ────────────────────────────────────────────────────────────

class EmotionDetector:

    def __init__(self):
        self.cap              = None
        self.frame_count      = 0
        self.last_result      = None
        self.last_emotions    = {}
        self.paused           = False
        self.fps              = 0
        self.fps_time         = time.time()
        self.fps_frame_count  = 0
        self.analysis_time_ms = 0
        self.face_box         = None   # (x, y, w, h) del último rostro detectado

    # ── cámara ────────────────────────────────────────────────────────────────

    def open_camera(self):
        self.cap = cv2.VideoCapture(CAMERA_INDEX)
        if not self.cap.isOpened():
            raise RuntimeError(
                f"No se pudo abrir la cámara (índice {CAMERA_INDEX}).\n"
                "Prueba cambiando CAMERA_INDEX a 1 o verifica los permisos."
            )
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT,  720)
        self.cap.set(cv2.CAP_PROP_FPS,            30)
        print("YAY! La cámara iniciada correctamente.")

    # ── análisis ──────────────────────────────────────────────────────────────

    def analyze_frame(self, frame):
        t0 = time.time()
        try:
            results = DeepFace.analyze(
                frame,
                actions=["emotion"],
                enforce_detection=True,
                detector_backend="opencv",
                silent=True,
            )
            result = results[0] if isinstance(results, list) else results
            self.last_emotions = result["emotion"]                  # dict emoción→porcentaje
            self.last_result   = result["dominant_emotion"]

            # Guardar caja del rostro si está disponible
            region = result.get("region", {})
            if region:
                self.face_box = (
                    region.get("x", 0),
                    region.get("y", 0),
                    region.get("w", 0),
                    region.get("h", 0),
                )

        except Exception:
            # Sin rostro detectado o error transitorio
            self.last_result   = None
            self.last_emotions = {}
            self.face_box      = None

        self.analysis_time_ms = int((time.time() - t0) * 1000)

    # ── dibujo HUD ────────────────────────────────────────────────────────────

    def draw_face_box(self, frame):
        """Dibuja el rectángulo alrededor del rostro."""
        if self.face_box is None:
            return
        x, y, w, h = self.face_box
        emotion     = self.last_result or "neutral"
        color       = EMOTION_COLORS.get(emotion, (200, 200, 200))

        # Rectángulo principal
        draw_rounded_rect(frame, (x, y), (x + w, y + h), color, 2, radius=12)

        # Esquineros decorativos
        sz = 18
        lw = 3
        for cx, cy, a1, a2 in [
            (x,     y,     180, 270),
            (x + w, y,     270, 360),
            (x,     y + h,  90, 180),
            (x + w, y + h,   0,  90),
        ]:
            cv2.ellipse(frame, (cx, cy), (sz, sz), 0, a1, a2, color, lw)

    def draw_emotion_bars(self, frame, panel_x, panel_y):
        """Dibuja barras de progreso para cada emoción."""
        if not self.last_emotions:
            return

        sorted_emotions = sorted(self.last_emotions.items(), key=lambda x: x[1], reverse=True)
        bar_h   = 18
        bar_gap = 28
        bar_w   = 180
        font    = cv2.FONT_HERSHEY_SIMPLEX

        for i, (emo, pct) in enumerate(sorted_emotions):
            y_off = panel_y + i * bar_gap
            label = LABELS.get(emo, emo)
            color = EMOTION_COLORS.get(emo, (180, 180, 180))
            fill  = int(bar_w * pct / 100)

            # Fondo barra
            filled_rounded_rect(frame, (panel_x, y_off), (panel_x + bar_w, y_off + bar_h),
                                 (40, 40, 40), radius=6, alpha=1.0)
            # Relleno barra
            if fill > 0:
                filled_rounded_rect(frame, (panel_x, y_off), (panel_x + fill, y_off + bar_h),
                                     color, radius=6, alpha=1.0)
            # Etiqueta
            put_text_with_shadow(frame, f"{label}  {pct:.0f}%",
                                 (panel_x + bar_w + 8, y_off + 13),
                                 font, 0.42, (230, 230, 230), 1)

    def draw_hud(self, frame):
        h, w = frame.shape[:2]
        font = cv2.FONT_HERSHEY_SIMPLEX

        # ── Panel superior izquierdo ──────────────────────────────────────────
        # Fondo semitransparente
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (360, 52), (15, 15, 15), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

        put_text_with_shadow(frame, "DETECTOR DE EMOCIONES", (10, 22),
                             font, 0.55, (0, 220, 180), 1)
        put_text_with_shadow(frame, f"FPS: {self.fps:.0f}  |  Análisis: {self.analysis_time_ms}ms",
                             (10, 44), font, 0.38, (160, 160, 160), 1)

        # ── Emoción dominante ─────────────────────────────────────────────────
        if self.last_result:
            label  = LABELS.get(self.last_result, self.last_result)
            color  = EMOTION_COLORS.get(self.last_result, (255, 255, 255))
            conf   = self.last_emotions.get(self.last_result, 0)

            # Caja principal centrada abajo
            box_w, box_h = 420, 70
            bx = (w - box_w) // 2
            by = h - box_h - 16

            overlay2 = frame.copy()
            cv2.rectangle(overlay2, (bx, by), (bx + box_w, by + box_h), (10, 10, 10), -1)
            cv2.addWeighted(overlay2, 0.65, frame, 0.35, 0, frame)

            draw_rounded_rect(frame, (bx, by), (bx + box_w, by + box_h), color, 2, radius=14)

            # Barra de confianza
            conf_fill = int((box_w - 20) * conf / 100)
            cv2.rectangle(frame, (bx + 10, by + box_h - 10), (bx + 10 + conf_fill, by + box_h - 4), color, -1)
            cv2.rectangle(frame, (bx + 10, by + box_h - 10), (bx + box_w - 10,     by + box_h - 4), (60, 60, 60), 1)

            put_text_with_shadow(frame, label,        (bx + 20, by + 30), font, 0.9,  color,           2)
            put_text_with_shadow(frame, f"{conf:.1f}% confianza", (bx + 20, by + 52), font, 0.48, (200, 200, 200), 1)

        elif not self.paused:
            put_text_with_shadow(frame, "Buscando rostro...", (w // 2 - 120, h - 50),
                                 font, 0.7, (80, 80, 80), 1)

        # ── Barras laterales derecha ──────────────────────────────────────────
        if SHOW_ALL_BARS and self.last_emotions:
            panel_x = w - 390
            panel_y = 70
            # Fondo panel
            n = len(self.last_emotions)
            ph = n * 28 + 20
            overlay3 = frame.copy()
            cv2.rectangle(overlay3, (panel_x - 10, panel_y - 10),
                          (w - 5, panel_y + ph), (15, 15, 15), -1)
            cv2.addWeighted(overlay3, 0.55, frame, 0.45, 0, frame)
            self.draw_emotion_bars(frame, panel_x, panel_y)

        # ── Estado pausa ──────────────────────────────────────────────────────
        if self.paused:
            put_text_with_shadow(frame, "⏸  PAUSADO  —  P para reanudar",
                                 (w // 2 - 190, h // 2),
                                 font, 0.85, (0, 180, 255), 2)

        # ── Controles esquina inferior izquierda ──────────────────────────────
        ctrl_y = h - 14
        put_text_with_shadow(frame, "Q: Salir  |  S: Captura  |  P: Pausar",
                             (10, ctrl_y), font, 0.35, (100, 100, 100), 1)

    # ── loop principal ────────────────────────────────────────────────────────

    def run(self):
        self.open_camera()
        cv2.namedWindow("Detector de Emociones", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Detector de Emociones", 1280, 720)

        print("\n🎥 Iniciando detección...")
        print("   Presiona  Q  para salir")
        print("   Presiona  S  para guardar captura")
        print("   Presiona  P  para pausar/reanudar\n")

        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("No se puede leer frame de la cámara.")
                break

            frame = cv2.flip(frame, 1)   # Espejo horizontal (más natural)

            # Cálculo de FPS
            self.fps_frame_count += 1
            elapsed = time.time() - self.fps_time
            if elapsed >= 1.0:
                self.fps            = self.fps_frame_count / elapsed
                self.fps_time       = time.time()
                self.fps_frame_count = 0

            # Análisis periódico
            if not self.paused and self.frame_count % ANALYZE_EVERY == 0:
                self.analyze_frame(frame)

            self.frame_count += 1

            # Dibujar HUD
            self.draw_face_box(frame)
            self.draw_hud(frame)

            cv2.imshow("Detector de Emociones", frame)

            # Teclas
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                print("👋 Cerrando...")
                break
            elif key == ord('s'):
                fname = f"captura_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                cv2.imwrite(fname, frame)
                print(f"📸 Captura guardada: {fname}")
            elif key == ord('p'):
                self.paused = not self.paused
                estado = "Pausado" if self.paused else "Reanudado"
                print(f"⏸  {estado}")

        self.cap.release()
        cv2.destroyAllWindows()


# ── ENTRY POINT ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("╔═════════════════════════════════════════════════════╗")
    print("║     DETECTOR DE EMOCIONES | G(2) INTERACCIÓN H-M    ║")
    print("╚═════════════════════════════════════════════════════╝\n")
    print("Verificando dependencias tuptuptup...")

    try:
        import deepface
        print(f"  YAY! DeepFace encontrado: {deepface.__version__}")
    except ImportError:
        print("  UPS! DeepFace no encontrado.")
        print("     Instala con:  pip install deepface tf-keras")
        exit(1)

    try:
        import cv2
        print(f"  YAY! OpenCV encontrado  {cv2.__version__}")
    except ImportError:
        print("  UPS!   OpenCV no encontrado.")
        print("     Instala con:  pip install opencv-python")
        exit(1)

    print()
    detector = EmotionDetector()
    detector.run()