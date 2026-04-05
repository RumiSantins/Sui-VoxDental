FROM python:3.10-slim

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema operativo (ffmpeg es requerido por Whisper)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar los requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente (excluyendo lo del .dockerignore)
COPY src/ src/
COPY *.py ./

EXPOSE 8000

# Arrancar el servidor
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
