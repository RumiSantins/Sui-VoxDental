import whisper
import time
import os

# Fix for OpenMP runtime conflict (OMP Error #15) on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def test_whisper_load():
    print("Iniciando prueba de carga de Whisper...")
    start_time = time.time()
    try:
        model = whisper.load_model("base")
        print(f"EXITO: Modelo cargado en {time.time() - start_time:.2f} segundos.")
    except Exception as e:
        print(f"ERROR: No se pudo cargar Whisper: {e}")

if __name__ == "__main__":
    test_whisper_load()
