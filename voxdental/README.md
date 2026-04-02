# VoxDental - Hands-free Voice Odontogram

VoxDental es un sistema de odontograma manos libres que utiliza reconocimiento de voz para registrar hallazgos clínicos dentales de forma eficiente y precisa.

## 🚀 Inicio Rápido (Resumen de comandos)

Si ya tienes las dependencias instaladas, estos son los comandos básicos:

| Componente | Ubicación (Directorio) | Comando para Ejecutar |
| :--- | :--- | :--- |
| **Backend** | `c:\apps\Sui\voxdental\` | `poetry run uvicorn src.main:app --reload` |
| **Frontend** | `c:\apps\Sui\voxdental\frontend\` | `npm run dev` |

---

## 📂 Estructura del Proyecto

Para que encuentres todo fácilmente:

```text
voxdental/
├── src/                <-- [BACKEND] Lógica de Python (FastAPI)
│   └── main.py         <-- Punto de entrada del servidor
├── frontend/           <-- [FRONTEND] Código de React
│   └── src/            <-- Componentes del Odontograma
├── pyproject.toml      <-- Configuración de Poetry
└── voxdental.db        <-- Base de datos SQLite
```

---

## 🛠️ Configuración Paso a Paso

### 1. Requisitos Previos
- Python 3.10+
- [Poetry](https://python-poetry.org/)
- Node.js (v18+)

### 2. Configuración del Backend (Python)

**Ubicación: Carpeta raíz del proyecto (`c:\apps\Sui\voxdental\`)**

#### Opción A: Comando Directo (Recomendado)
Si ya tienes `uvicorn` instalado, usa este comando:
```powershell
uvicorn src.main:app --reload
```

#### Opción B: Usando Entorno Virtual (Venv)
Si necesitas instalar las dependencias primero:
```powershell
# 1. Crear y activar entorno
python -m venv venv
.\venv\Scripts\activate

# 2. Instalar paquetes
pip install -r requirements.txt

# 3. Iniciar servidor
uvicorn src.main:app --reload
```

#### Opción C: Usando Poetry
```powershell
poetry install
poetry run uvicorn src.main:app --reload
```

> [!NOTE]
> El backend corre en `http://localhost:8000`. Puedes ver la documentación en `http://localhost:8000/docs`.

### 3. Configuración del Frontend (React)

**Debes navegar a la carpeta de la interfaz (`c:\apps\Sui\voxdental\frontend\`):**

```powershell
# 1. Entrar a la carpeta
cd frontend

# 2. Instalar paquetes
npm install

# 3. Iniciar entorno de desarrollo
npm run dev
```

> [!TIP]
> La aplicación web abrirá usualmente en `http://localhost:5173`.

---

## 🦷 Características Principales

- **Odontograma Interactivo**: Representación visual clínica detallada.
- **Voz a Datos**: Integración con OpenAI Whisper.
- **Estandarización**: Patologías en rojo, tratamientos en azul.
- **Database**: Persistencia inteligente mediante SQLite.

## Desarrollo y Contribución

- **Lógica de Voz**: Revisa `diagnostic_api.py` y `src/services/`.
- **Interfaz Dental**: El componente central es `frontend/src/components/OdontogramView.jsx`.
