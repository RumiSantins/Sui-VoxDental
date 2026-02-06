import os
import shutil
import imageio_ffmpeg

print("--- DIAGNOSTICO FFMPEG ---")
try:
    exe_path = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Ruta real del ejecutable imageio: {exe_path}")
    print(f"Nombre del archivo: {os.path.basename(exe_path)}")
    
    ffmpeg_dir = os.path.dirname(exe_path)
    print(f"Directorio: {ffmpeg_dir}")
    
    # Inject
    os.environ["PATH"] += os.pathsep + ffmpeg_dir
    
    # Check resolution
    resolved = shutil.which("ffmpeg")
    print(f"shutil.which('ffmpeg') dice: {resolved}")
    
except Exception as e:
    print(f"Error: {e}")
