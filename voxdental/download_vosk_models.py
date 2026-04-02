import os
import urllib.request
import zipfile
import sys

# Define base URL and models
MODELS = {
    "vosk-model-small-es-0.42": "https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip",
    # Opcionalmente se pueden añadir más aquí:
    # "vosk-model-es-0.42": "https://alphacephei.com/vosk/models/vosk-model-es-0.42.zip"
}

def report(count, blockSize, totalSize):
    percent = int(count * blockSize * 100 / totalSize)
    if percent > 100:
        percent = 100
    sys.stdout.write(f"\rDescargando... {percent}%")
    sys.stdout.flush()

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(root_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    for model_name, url in MODELS.items():
        model_path = os.path.join(models_dir, model_name)
        
        if os.path.exists(model_path) and os.listdir(model_path):
            print(f"El modelo {model_name} ya existe en {model_path}. Saltando descarga.")
            continue
            
        print(f"\nPreparando descarga de {model_name}...")
        zip_path = os.path.join(models_dir, f"{model_name}.zip")
        
        try:
            print(f"Descargando desde {url}")
            urllib.request.urlretrieve(url, zip_path, reporthook=report)
            print(f"\nDescarga completada. Descomprimiendo en {models_dir}...")
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(models_dir)
                
            print("Extracción completa.")
            os.remove(zip_path) # Limpiar archivo zip
            print("Archivo ZIP eliminado.")
        except Exception as e:
            print(f"\nError durante la descarga o extracción: {e}")

if __name__ == "__main__":
    main()
