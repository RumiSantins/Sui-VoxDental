import os
import tempfile
import time
import asyncio
from typing import BinaryIO
import warnings
import shutil
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Filter harmless warnings
warnings.filterwarnings("ignore", category=UserWarning)

class WhisperService:
    def __init__(self):
        self.log_file = os.path.join(os.getcwd(), "whisper_debug.log")
        self._log("--- INICIANDO WHISPERSERVICE (V6 Zero-Latency Startup) ---")
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        self.models_cache = {} 
        self.use_api = False
        self.device = "cpu"
        self.compute_type = "int8"
        self._gpu_detected = None # Lazy detection

        if self.api_key and self.api_key.strip():
            from openai import AsyncOpenAI
            try:
                self.client = AsyncOpenAI(api_key=self.api_key)
                self.use_api = True
                self._log("MODO DETECTADO: OpenAI API (Máxima precisión activada)")
            except Exception as e:
                self._log(f"Error inicializando OpenAI Client: {e}")

    def _log(self, message: str):
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"[{timestamp}] {message}\n")
        except:
            pass
        print(message)

    def _detect_gpu(self):
        """Lazy detection of GPU to avoid blocking server startup."""
        if self._gpu_detected is not None:
            return self._gpu_detected
            
        self._log("Detectando aceleración por hardware...")
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
                self.compute_type = "float16"
                self._gpu_detected = True
                self._log("DISPOSITIVO DETECTADO: CUDA (GPU Turbo Activo)")
            else:
                self._gpu_detected = False
                self._log("DISPOSITIVO DETECTADO: CPU")
        except:
            self._gpu_detected = False
            self._log("DISPOSITIVO DETECTADO: CPU (Torch no disponible)")
        
        return self._gpu_detected

    def _inject_cuda_libs(self):
        """Allows Python to find CUDA libs installed via pip (Lazy)."""
        try:
            import nvidia.cublas.lib
            import nvidia.cudnn.lib
            
            cublas_path = os.path.dirname(nvidia.cublas.lib.__file__)
            cudnn_path = os.path.dirname(nvidia.cudnn.lib.__file__)
            
            # Add to LD_LIBRARY_PATH in the current process
            paths = [cublas_path, cudnn_path]
            existing = os.environ.get("LD_LIBRARY_PATH", "")
            for p in paths:
                if p not in existing:
                    existing = f"{p}:{existing}" if existing else p
            
            os.environ["LD_LIBRARY_PATH"] = existing
            return True
        except:
            return False

    def _get_local_model(self, model_size: str):
        """Loads or retrieves a model from cache (Lazy)."""
        from faster_whisper import WhisperModel
        
        # 4060 Optimization: Map standard models to Distilled versions for speed
        model_map = {
            "large": "systran/faster-distil-whisper-large-v3",
            "large-v3": "systran/faster-distil-whisper-large-v3",
            "medium": "medium", 
            "small": "small",
            "base": "base"
        }
        
        target_model = model_map.get(model_size.lower(), model_size)
        
        if target_model not in self.models_cache:
            self._inject_cuda_libs()
            self._detect_gpu()
            self._log(f"Cargando modelo '{target_model}' en {self.device}...")
            try:
                self.models_cache[target_model] = WhisperModel(
                    target_model, 
                    device=self.device, 
                    compute_type=self.compute_type,
                    download_root=os.path.join(os.getcwd(), "models", "whisper")
                )
                self._log(f"Modelo '{target_model}' listo.")
            except Exception as e:
                self._log(f"ERROR cargando '{target_model}': {e}")
                return None
        
        return self.models_cache[target_model]

    def _sync_transcribe_local(self, tmp_path: str, prompt: str, model_name: str):
        """Synchronous part of transcription optimized for quality and speed."""
        model = self._get_local_model(model_name)
        if not model:
            return None

        # Speed optimization: Use beam_size=1 on CPU for near-instant results
        # Use beam_size=5 only on GPU for maximum precision
        is_gpu = self.device == "cuda"
        
        segments, info = model.transcribe(
            tmp_path,
            beam_size=1 if (not is_gpu or "distil" in model_name.lower()) else 3,
            language="es",
            initial_prompt=prompt,
            vad_filter=True, 
            vad_parameters=dict(min_silence_duration_ms=600), # Increased for dental pauses
            best_of=1
        )
        
        text = " ".join([seg.text for seg in segments]).strip()
        
        # Cleanup: Remove common "instructional" hallucinations
        forbidden_phrases = [
            "POR FAVOR TRANSCRIBE EN ESPAÑOL",
            "Contexto: Odontología",
            "Dientes:",
            "Términos:",
            "Habla en Español:"
        ]
        
        for phrase in forbidden_phrases:
            if phrase.lower() in text.lower():
                # If the text is JUST the forbidden phrase or a variation, clear it
                import re
                text = re.sub(re.escape(phrase), "", text, flags=re.IGNORECASE).strip()
        
        return text

    async def transcribe(self, audio_file: BinaryIO, requested_model: str = None) -> str:
        """
        Transcribes audio to text using the user-requested model.
        """
        try:
            model_to_use = requested_model or os.getenv("WHISPER_MODEL_DEFAULT", "small")
            self._log(f"--- Nueva petición ({'API' if self.use_api else 'Local'}) - Modelo: {model_to_use} ---")
            
            content = await audio_file.read()
            if not content: return ""

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            dental_prompt = (
                "Transcripción dental clínica en español. "
                "Piezas: 11, 12, 13, 14, 15, 16, 17, 18. "
                "Hallazgos: caries, resina, amalgama, corona, endodoncia, ausencia, oclusal, mesial, distal. "
                "Ejemplo: paciente presenta caries en cara oclusal del diente 14."
            )

            start_t = time.time()
            text = ""

            if self.use_api:
                try:
                    from openai import AsyncOpenAI
                    with open(tmp_path, "rb") as audio:
                        response = await asyncio.wait_for(
                            self.client.audio.transcriptions.create(
                                model="whisper-1",
                                file=audio,
                                prompt=f"Habla en Español: {dental_prompt}",
                                language="es",
                                temperature=0
                            ),
                            timeout=8.0
                        )
                    text = response.text
                except Exception as api_err:
                    err_msg = str(api_err).lower()
                    if "429" in err_msg or "insufficient_quota" in err_msg:
                        self.use_api = False
                        self._log("CIRCUIT BREAKER: Quota OpenAI agotada.")
                    else:
                        self._log(f"FALLO API ({api_err}). Reintentando local...")
                    
                    text = await asyncio.to_thread(self._sync_transcribe_local, tmp_path, dental_prompt, model_to_use)
            else:
                text = await asyncio.to_thread(self._sync_transcribe_local, tmp_path, dental_prompt, model_to_use)

            duration = time.time() - start_t
            self._log(f"Transcripción ({duration:.2f}s): '{text}'")
            
            if text:
                text = text.replace("Carries", "Caries").replace("Carri is", "Caries").replace("the 14", "la 14")

            try: os.remove(tmp_path)
            except: pass
            
            return text or ""
            
        except Exception as e:
            self._log(f"ERROR: {e}")
            return f"Error: {str(e)}"
