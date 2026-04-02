import os
import wave
import json
import time
import subprocess
import tempfile
import vosk
from typing import BinaryIO

class VoskService:
    def __init__(self):
        self.models = {}
        self.log_file = os.path.join(os.getcwd(), "vosk_debug.log")
        self._log("--- INICIANDO VOSK SERVICE ---")

        # Configurar FFmpeg
        self.ffmpeg_path = "ffmpeg"
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
            if os.path.exists(exe):
                self.ffmpeg_path = exe
                self._log(f"FFMPEG Detectado para Vosk: {self.ffmpeg_path}")
        except Exception as e:
            self._log(f"No se pudo inyectar ffmpeg vía imageio_ffmpeg: {e}, usando '{self.ffmpeg_path}' local.")

    def _log(self, message: str):
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"[{timestamp}] {message}\n")
        except:
            pass
        print(message)

    def _load_model(self, model_name: str):
        if model_name in self.models:
            return self.models[model_name]

        model_path = os.path.join(os.getcwd(), "models", model_name)
        if not os.path.exists(model_path):
            self._log(f"Modelo {model_name} no encontrado en {model_path}.")
            # Intentar fallback si es el caso
            default_fallback = os.path.join(os.getcwd(), "models", "vosk-model-small-es-0.42")
            if os.path.exists(default_fallback):
                self._log(f"Usando modelo default: vosk-model-small-es-0.42 en su lugar.")
                model_path = default_fallback
            else:
                raise Exception(f"No existe el modelo {model_name} ni el de fallback en la carpeta models/.")
        
        self._log(f"Cargando modelo Vosk: {model_name}...")
        try:
            # Desactivar logs detallados de vosk si no se configuran a nivel de sistema.
            vosk.SetLogLevel(-1) 
            model = vosk.Model(model_path)
            self.models[model_name] = model
            self._log(f"Modelo Vosk {model_name} cargado correctamente.")
            return model
        except Exception as e:
            self._log(f"ERROR cargando modelo Vosk {model_name}: {e}")
            raise e

    async def transcribe(self, audio_file: BinaryIO, model_name: str = "vosk-model-small-es-0.42") -> str:
        """
        Transcribe audio a texto usando Vosk.
        Primero convierte el archivo de audio a WAV (16000Hz, mono) con FFmpeg.
        """
        try:
            self._log(f"--- Nueva petición Vosk (Modelo: {model_name}) ---")
            
            # Cargar modelo bajo demanda
            model = self._load_model(model_name)
            
            content = await audio_file.read()
            if not content:
                self._log("Audio vacío.")
                return ""

            # Guardar el contenido original en un temporal
            with tempfile.NamedTemporaryFile(delete=False) as tmp_in:
                tmp_in.write(content)
                tmp_in_path = tmp_in.name

            # Archivo de salida WAV
            tmp_out_path = tmp_in_path + ".wav"

            # Conversión usando FFMPEG (16kHz, mono, pcm_s16le)
            self._log(f"Convirtiendo audio para Vosk...")
            command = [
                self.ffmpeg_path,
                "-y",                    # overwrite
                "-i", tmp_in_path,       # input
                "-ar", "16000",          # rate 16000
                "-ac", "1",              # 1 channel (mono)
                "-f", "wav",             # format wav
                tmp_out_path             # output
            ]

            process = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if process.returncode != 0:
                self._log(f"Error FFmpeg: {process.stderr.decode()}")
                raise Exception("Fallo convirtiendo audio para Vosk")

            self._log("Audio convertido. Iniciando reconocimiento Vosk...")
            start_t = time.time()
            
            # Procesar el WAV con Vosk
            wf = wave.open(tmp_out_path, "rb")
            rec = vosk.KaldiRecognizer(model, wf.getframerate())
            
            # Opcional: Para palabras muy específicas, se podría pasar un grammar
            # rec = vosk.KaldiRecognizer(model, wf.getframerate(), '["caries", "mesial", "resina", "[unk]"]')

            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                rec.AcceptWaveform(data)
            
            # Resultado final
            res = json.loads(rec.FinalResult())
            text = res.get("text", "").strip()
            
            wf.close()
            duration = time.time() - start_t
            
            self._log(f"Vosk Finalizado en {duration:.2f}s: '{text}'")

            # Cleanup
            try:
                os.remove(tmp_in_path)
                os.remove(tmp_out_path)
            except:
                pass
            
            return text

        except Exception as e:
            self._log(f"ERROR CRITICO Vosk: {e}")
            return f"Error procesando audio con Vosk: {str(e)}"
