import whisper
import os
import tempfile
import time
from typing import BinaryIO
import warnings
import shutil
import sys

# Filter harmless warnings
warnings.filterwarnings("ignore")

class WhisperService:
    def __init__(self):
        self.model = None
        self.use_mock = False
        # Move log file to a more reliable location if needed, but root is fine
        self.log_file = os.path.join(os.getcwd(), "whisper_debug.log")
        
        # Ensure log file starts fresh or at least exists
        self._log("--- INICIANDO WHISPERSERVICE (Tiny Model Override) ---")

        # --- FFMPEG ROBUST INJECTION ---
        try:
            import imageio_ffmpeg
            source_exe = imageio_ffmpeg.get_ffmpeg_exe()
            self._log(f"FFMPEG Source path: {source_exe}")
            source_dir = os.path.dirname(source_exe)
            
            # Add to PATH for this process
            if source_dir not in os.environ["PATH"]:
                os.environ["PATH"] += os.pathsep + source_dir
            
            if shutil.which("ffmpeg"):
                self._log(f"FFMPEG Detectado: {shutil.which('ffmpeg')}")
            else:
                self._log("FFMPEG ERROR: 'ffmpeg' no encontrado en el PATH después de inyección.")

        except Exception as e:
            self._log(f"ERROR configurando FFMPEG: {e}")

        # --- WHISPER LOAD ---
        self._log("Cargando modelo Whisper 'base' (más preciso para odontología)...")
        try:
            # Fix OMP error here just in case
            os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
            
            start_load = time.time()
            self.model = whisper.load_model("base")
            self._log(f"Modelo Whisper cargado en {time.time() - start_load:.2f}s.")
        except Exception as e:
            self._log(f"ERROR FATAL cargando modelo: {e}")
            self.use_mock = True

    def _log(self, message: str):
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"[{timestamp}] {message}\n")
        except:
            pass
        print(message)

    async def transcribe(self, audio_file: BinaryIO) -> str:
        """
        Transcribes audio to text using Whisper with detailed logging.
        """
        if self.use_mock or not self.model:
            self._log("TRANSCRIPCION ABORTADA: Modelo no cargado.")
            return "ERROR: El sistema de voz no está activo."

        try:
            self._log("--- Nueva petición de transcripción recibida ---")
            
            # Read audio content
            content = await audio_file.read()
            if not content:
                self._log("ADVERTENCIA: Audio vacío recibido.")
                return ""

            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            self._log(f"Audio temporal: {tmp_path} ({len(content)} bytes)")
            
            # Dental context prompt (Expanded with numbers to bias the model)
            dental_prompt = (
                "Odontograma dental: 11, 12, 13, 14, 15, 16, 17, 18, "
                "21, 22, 23, 24, 25, 26, 27, 28, "
                "31, 32, 33, 34, 35, 36, 37, 38, "
                "41, 42, 43, 44, 45, 46, 47, 48. "
                "Comandos: caries, resina, amalgama, corona, endodoncia, conducto, ausencia, ausente, "
                "borrar, limpiar, oclusal, incisal, vestibular, lingual, palatina, mesial, distal."
            )
            
            self._log("Llamando a model.transcribe (esto puede tardar unos segundos)...")
            start_t = time.time()
            
            # Final transcription call optimized for SPEED
            result = self.model.transcribe(
                tmp_path, 
                language="es", 
                fp16=False, 
                initial_prompt=dental_prompt,
                temperature=0       # Greedy decoding (fastest) with deterministic results
            )
            
            duration = time.time() - start_t
            text = result.get("text", "").strip()
            
            self._log(f"Transcripción exitosa en {duration:.2f}s: '{text}'")
            
            # Cleanup
            try:
                os.remove(tmp_path)
            except:
                pass
            
            return text
            
        except Exception as e:
            self._log(f"ERROR CRITICO en transcribe: {e}")
            return f"Error procesando audio: {str(e)}"
