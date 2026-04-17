# Arquitectura de Sistemas

El sistema SuiEgo esta diseñado bajo una arquitectura de microservicios simplificada basada en contenedores Docker, lo que garantiza la portabilidad y escalabilidad entre entornos de desarrollo y produccion.

## Stack Tecnologico

| Componente | Tecnologia | Funcion |
| :--- | :--- | :--- |
| Frontend | React + Vite | Interfaz de usuario reactiva y ligera. |
| Backend | FastAPI (Python) | Procesamiento logico, API REST y motores de voz. |
| Base de Datos | SQLite | Almacenamiento persistente de registros clinicos. |
| Contenedores | Docker + Compose | Orquestacion y aislamiento de servicios. |
| Servidor Web | Nginx | Proxy inverso, seguridad SSL y servido de estaticos. |

---

## Flujo de Comunicacion

La interaccion entre servicios se realiza de la siguiente manera:

1. **Cliente a Nginx**: El navegador del usuario accede mediante HTTPS a los dominios virtuales (ej. nip.io).
2. **Nginx a Contenedores**:
   - Las peticiones a la raiz `/` se redirigen al contenedor de **Frontend** (puerto 3000).
   - Las peticiones a `/api/` se redirigen al contenedor de **Backend** (puerto 8000).
3. **Backend a Motores de Voz**: El servidor FastAPI procesa archivos de audio utilizando Whisper (vía API u local) o Vosk según la configuración del perfil del usuario.

## Seguridad e Infraestructura

El despliegue actual en Google Cloud Platform (GCE) utiliza las siguientes capas de seguridad:
- **HTTPS forzado**: Todas las peticiones HTTP (puerto 80) son redirigidas automaticamente a HTTPS (puerto 443) mediante Nginx.
- **Aislamiento de Docker**: Los servicios corren en contenedores independientes, limitando el acceso directo al sistema de archivos del host.
- **Certificados SSL**: Gestionados por Let's Encrypt con renovacion automatica.

---

## Diagrama de Puertos (Host)

| Servicio | Puerto Host | Puerto Interno (Docker) |
| :--- | :--- | :--- |
| Nginx (HTTP) | 80 | - |
| Nginx (HTTPS) | 443 | - |
| Backend API | 8000 | 8000 |
| Frontend App | 3000 | 80 |
