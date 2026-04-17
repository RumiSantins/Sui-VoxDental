# Guia de Desarrollo Local

Esta guia describe los pasos necesarios para poner en funcionamiento el entorno de desarrollo de EgoS en una maquina local.

## Requisitos Previos

- **Node.js**: Version 18 o superior.
- **Python**: Version 3.10 o superior.
- **Docker y Docker Compose**: Opcional para desarrollo rapido, pero recomendado para simular el entorno final.

---

## Instalacion y Configuracion

### 1. Clonar el repositorio
Si aun no tienes el codigo, clona el repositorio desde la fuente oficial:
```bash
git clone https://github.com/FaustoSoftware/Sui-VoxDental.git
cd voxdental
```

### 2. Configuracion del Backend
Crea un entorno virtual de Python y activa las dependencias:
```bash
# Crear entorno virtual
python -m venv venv

# Activar en Windows
.\venv\Scripts\activate

# Instalar librerias
pip install -r requirements.txt
```

Copia el archivo `.env.example` a `.env` y completa las variables necesarias, especialmente `SECRET_KEY` y `GOOGLE_CLIENT_ID`.

### 3. Configuracion del Frontend
Entra en la carpeta del frontend e instala las dependencias de Node:
```bash
cd frontend
npm install
```

---

## Ejecucion en Modo Desarrollo

Para trabajar en el codigo y ver los cambios en tiempo real, inicia ambos servicios por separado:

### Iniciar Backend
Desde la carpeta raiz (con el entorno virtual activo):
```bash
python -m src.main
```
El servidor estara disponible en `http://localhost:8000`. Puedes acceder a la documentacion interactiva en `/docs`.

### Iniciar Frontend
Desde la carpeta `frontend/`:
```bash
npm run dev
```
La aplicacion estara disponible en `http://localhost:5173`.

---

## Comandos Utiles

| Tarea | Comando |
| :--- | :--- |
| Instalar nuevas dependencias (Python) | `pip install [paquete]` |
| Instalar nuevas dependencias (JS) | `npm install [paquete]` |
| Limpiar cache de Vite | `npm run dev -- --force` |
| Ejecutar con Docker Compose | `docker-compose up --build` |
