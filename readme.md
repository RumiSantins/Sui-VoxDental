# VoxDental

Sistema de odontograma manos libres controlado por voz.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1.  **Python 3.10+**
2.  **Node.js** y **npm**
3.  **FFmpeg**: [Descargar aquí](https://ffmpeg.org/download.html). Necesario para el procesamiento de audio con Whisper. Asegúrate de añadirlo a tu PATH.
4.  **Poetry**: Gestor de dependencias de Python.

> **Nota si no tienes Poetry instalado:**
> Si el comando `poetry` no se reconoce, instálalo ejecutando esto en PowerShell:
> ```powershell
> (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
> ```
> O visita la [documentación oficial](https://python-poetry.org/docs/#installation).
> **Reinicia la terminal después de instalar.**

---

## Cómo Iniciar el Proyecto

Sigue estos pasos en orden.

### 1. Backend (FastAPI)

El backend maneja la lógica de transcripción y la API.

> **Ubicación:** Ejecuta estos comandos desde la carpeta `voxdental`.

```bash
# 1. Si estás en la carpeta raiz (Sui), entra a voxdental:
cd voxdental

# 2. Instalar dependencias (solo la primera vez):
poetry install

# 3. Iniciar el servidor:
poetry run uvicorn src.main:app --reload

# OPCIÓN ALTERNATIVA (Si 'poetry' falla o no está instalado):
uvicorn src.main:app --reload
```

*El servidor backend estará corriendo en: `http://localhost:8000`*

### 2. Frontend (React + Vite)

La interfaz de usuario.

> **Ubicación:** Abre una **nueva terminal** y entra a la carpeta del frontend.

```bash
# 1. Entrar a la carpeta del frontend (ajusta la ruta según donde estés):
cd voxdental/frontend

# 2. Instalar dependencias:
npm install

# 3. Iniciar el servidor de desarrollo:
npm run dev
```

*El frontend estará disponible en: `http://localhost:5173`*

---

## Utilidades

### Verificar FFmpeg

Si tienes problemas con el reconocimiento de voz, verifica FFmpeg ejecutando este script desde la carpeta `voxdental`:

```bash
python check_ffmpeg.py
```

LISTA PARA DECIR sobre detecciones:
1. Hallazgos (Para pintar colores):
"Caries" (Rojo)
"Resina" o "Recina" (Azul)
"Amalgama" (Gris Oscuro)
"Corona" (Cubre el diente)
"Endodoncia" (Tratamiento de conducto)

2. Caras del Diente (Donde está el daño):
"Oclusal" (Centro - solo muelas)
"Incisal" (Borde - solo dientes delanteros)
"Vestibular" (Cara externa / arriba)
"Palatina" (Cara interna superior)
"Lingual" (Cara interna inferior)
"Mesial" (Lado derecho de ese diente)
"Distal" (Lado izquierdo de ese diente)

3. Dientes Perdidos:
"Ausente", "Ausencia", "Extraído", "Faltante" (Marca con una X)
Ejemplos de Frases Completas:
"Paciente con caries en oclusal de la 16"
"Resina en vestibular de la 11"
"Recina en la 21"
"Diente 46 ausente"
"Amalgama en oclusal de la 36"