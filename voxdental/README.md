# Sui-VoxDental: Odontograma con IA y Voz

![Sui-VoxDental](/voxdental/static/branding/screenshot.png) (Logo/Imagen si aplica)

**Sui-VoxDental** es una plataforma clínica moderna e inteligente diseñada para dentistas, que permite el registro manos libres de hallazgos clínicos mediante reconocimiento de voz en tiempo real. Utiliza inteligencia artificial para convertir descripciones clínicas en datos estructurados dentro de un odontograma interactivo.

---

## Características Principales

*   **Registro por Voz**: Integración con **Vosk** (local) y **OpenAI Whisper** para transcripción ultra-precisa.
*   **Odontograma Interactivo**: Representación visual de cada pieza dental con estados clínicos parametrizados (patologías en rojo, tratamientos en azul).
*   **Autenticación con Google**: Inicio de sesión seguro integrado con Google OAuth 2.0.
*   **Gestión de Pacientes**: Historias clínicas electrónicas persistentes con SQLite.
*   **Dashboard de Control**: Vista rápida de la actividad clínica y métricas clave.
*   **Despliegue Listos para la Nube**: Configuración completa de Docker para GCP (Google Cloud Platform).

---

## Stack Tecnológico

### Backend
*   **FastAPI** (Python 3.10+): API de alto rendimiento.
*   **SQLAlchemy**: ORM para gestión de base de datos.
*   **SQLite**: Base de datos ligera y eficiente.
*   **Vosk / Whisper**: Motores de procesamiento de lenguaje natural (NLP).
*   **Poetry**: Gestión de dependencias y paquetes.

### Frontend
*   **React 18**: Biblioteca UI dinámica.
*   **Vite**: Entorno de desarrollo ultra-rápido.
*   **Tailwind CSS**: Estilizado moderno y responsivo.
*   **React Router**: Navegación SPA fluida.

---

## Estructura del Proyecto

```text
voxdental/
├── src/                <-- [BACKEND] Lógica de Python (FastAPI)
│   ├── api/            <-- Rutas y Endpoints
│   ├── core/           <-- Configuración, DB session y Seguridad
│   ├── models/         <-- Modelos de SQLAlchemy
│   ├── services/       <-- Lógica de negocio (Vosk, Whisper, Odontograma)
│   └── main.py         <-- Punto de entrada del servidor
├── frontend/           <-- [FRONTEND] Código de React
│   ├── src/            <-- Componentes, Contextos y Vistas
│   ├── public/         <-- Activos estáticos
│   └── index.html      <-- Punto de entrada
├── static/             <-- Archivos estáticos servidos por el Backend
├── models/             <-- Directorio para modelos de Vosk (STT)
├── Dockerfile          <-- Configuración de imagen Docker para Backend
├── docker-compose.yml  <-- Orquestación local/producción
└── voxdental.db        <-- Base de datos principal
```

---

## Configuración Local

### 1. Variables de Entorno

#### Backend (`voxdental/.env`)
Crea un archivo `.env` basado en `.env.example`:
```ini
SECRET_KEY=tu-clave-secreta
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
BASE_URL=http://localhost:5173
```

#### Frontend (`voxdental/frontend/.env`)
```ini
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_API_URL=http://localhost:8000
```

### 2. Ejecución del Backend

**Ubicación: `voxdental/`**

```powershell
# Instalar dependencias con Poetry
poetry install

# Alternativa con pip
pip install -r requirements.txt

# Descargar modelos de voz necesarios (Vosk)
python download_vosk_models.py

# Iniciar servidor
uvicorn src.main:app --reload
```
> [!NOTE]
> Documentación interactiva en `http://localhost:8000/docs`.

### 3. Ejecución del Frontend

**Ubicación: `voxdental/frontend/`**

```powershell
npm install
npm run dev
```
> [!TIP]
> Aplicación accesible en `http://localhost:5173`.

---

## Docker y Despliegue

### Docker Compose (Local/Staging)
Para levantar todo el stack (Backend + Frontend + Nginx):
```powershell
docker compose up -d --build
```

### Despliegue en Google Cloud Platform (GCP)
El proyecto incluye un script automatizado para desplegar en una instancia de Compute Engine:
```powershell
./deploy-gcp.sh
```
*(Asegúrate de configurar los permisos de `gcloud` antes de ejecutar).*

---

## Desarrollo y Guía Técnica

- **Lógica de Voz**: Revisa `src/services/vosk_service.py` y `src/services/whisper.py`.
- **Componente Dental**: El núcleo de la interfaz está en `frontend/src/components/OdontogramView.jsx`.
- **Autenticación**: Gestionada en `frontend/src/context/AuthContext.jsx` y `src/core/security.py`.

---

## Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y haz commit: `git commit -m "feat: descripción del cambio"`
3. Envía tus cambios: `git push origin feature/nueva-funcionalidad`

---

¡Diseñado por el equipo de Sui-VoxDental!
