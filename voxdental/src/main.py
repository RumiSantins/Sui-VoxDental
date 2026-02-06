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
from .api.routes import router

app = FastAPI(title="Sui VoxDental API", version="0.1.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Sui VoxDental API is running"}
