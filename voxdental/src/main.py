# Punto de entrada principal para el servidor FastAPI de EgoS.
# Gestiona la inicialización de la app, middlewares y montaje de rutas estáticas.
import os
# Fix for OpenMP runtime conflict (OMP Error #15) on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Inject FFMPEG from imageio-ffmpeg if available
try:
    import imageio_ffmpeg
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_path)
    print(f"FFMPEG injected: {ffmpeg_path}")
except ImportError:
    print("Warning: imageio-ffmpeg not found. Whisper needs ffmpeg in PATH.")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.routes import router

app = FastAPI(title="EgoS API", version="0.1.0")

# Enable CORS for frontend
# En producción, configurar ALLOWED_ORIGINS=https://tu-dominio.com
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

# Mount static files
os.makedirs("static/media", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Sui VoxDental API is running"}
