import whisper
import os
import tempfile
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
        
        # --- FFMPEG ROBUST INJECTION ---
        try:
            import imageio_ffmpeg
            # 1. Get the actual binary path (e.g. .../ffmpeg-win64-v4.2.2.exe)
            source_exe = imageio_ffmpeg.get_ffmpeg_exe()
            source_dir = os.path.dirname(source_exe)
            
            # 2. Define the target alias "ffmpeg.exe"
            # We try to put it in the same folder first (cleaner)
            # If not writable, we put it in the current working directory of the app
            target_exe = os.path.join(source_dir, "ffmpeg.exe")
            
            try:
                # If it doesn't exist as "ffmpeg.exe", copy it
                if not os.path.exists(target_exe):
                    print(f"DEBUG: Creando alias ffmpeg.exe en {target_exe}")
                    shutil.copy(source_exe, target_exe)
                
                # Add THIS folder to PATH
                if source_dir not in os.environ["PATH"]:
                    os.environ["PATH"] += os.pathsep + source_dir
                    
            except Exception as e_copy:
                print(f"DEBUG: No se pudo escribir en {source_dir} ({e_copy}). Probando directorio local.")
                # Fallback: Copy to App Root
                app_root = os.getcwd() # c:\apps\Sui\voxdental
                target_exe_local = os.path.join(app_root, "ffmpeg.exe")
                if not os.path.exists(target_exe_local):
                    shutil.copy(source_exe, target_exe_local)
                
                if app_root not in os.environ["PATH"]:
                    os.environ["PATH"] += os.pathsep + app_root
            
            # Verify
            if shutil.which("ffmpeg"):
                print(f"EXITO: ffmpeg detectado en: {shutil.which('ffmpeg')}")
            else:
                print("DEBUG: ALERTA - ffmpeg sigue sin detectarse a pesar del alias.")

        except ImportError:
            print("DEBUG: imageio_ffmpeg no instalado.")
        except Exception as e:
            print(f"DEBUG: Error general configurando FFMPEG: {e}")
        # -------------------------------

        print("--------------------------------------------------")
        print("INIT: Intentando cargar modelo Whisper...")
        try:
            self.model = whisper.load_model("base")
            print("EXITO: Modelo Whisper cargado correctamente.")
        except Exception as e:
            print(f"ERROR FATAL: No se pudo cargar Whisper. Detalles: {e}")
            self.use_mock = True

    async def transcribe(self, audio_file: BinaryIO) -> str:
        """
        Transcribes audio to text using Whisper.
        """
        if self.use_mock or not self.model:
            return "ERROR: El sistema de voz no está activo. Verifique la consola del servidor."

        try:
            print("Procesando audio recibido...")
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                content = await audio_file.read() 
                tmp.write(content)
                tmp_path = tmp.name
            
            # Dental context prompt to guide the model
            dental_prompt = "Odontograma: caries, resina, amalgama, corona, endodoncia, pieza, diente, oclusal, incisal, vestibular, lingual, palatina, mesial, distal, ausente."
            
            result = self.model.transcribe(tmp_path, language="es", fp16=False, initial_prompt=dental_prompt)
            text = result["text"]
            
            print(f"Transcripción detectada: '{text}'")
            
            try:
                os.remove(tmp_path)
            except:
                pass
            
            return text
        except Exception as e:
            print(f"ERROR durante transcripción: {e}")
            return f"Error procesando audio: {str(e)}"
