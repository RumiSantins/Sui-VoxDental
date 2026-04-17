# Referencia Tecnica del Backend

El backend de SuiEgo es un servidor de alto rendimiento construido con FastAPI y Python 3.10. Su funcion principal es orquestar la seguridad, la persistencia de datos y el procesamiento de inteligencia artificial para voz.

## Arquitectura del Servidor

- `src/main.py`: Punto de entrada que inicializa la aplicacion y los middlewares de CORS.
- `src/api/routes.py`: Definicion de los endpoints de la API REST.
- `src/core/`: Logica de negocio central (procesamiento NLP, envio de correos, validaciones).
- `src/models/`: Definiciones de tablas para SQLAlchemy (SQLite).

---

## Motores de Inteligencia Artificial (Voz)

SuiEgo soporta dos motores principales para la conversion de voz a texto (STT):

### 1. Whisper (OpenAI)
Utilizado para alta precision. Puede funcionar mediante llamadas a la API de OpenAI o mediante una implementacion local de `faster-whisper` dependiendo de los recursos del servidor.

### 2. Vosk
Un motor offline ligero y extremadamente rapido, ideal para procesamientos de baja latencia donde la velocidad es critica. Se utilizan modelos optimizados para el idioma español.

---

## Seguridad y Autenticacion

### JWT (JSON Web Tokens)
El sistema utiliza tokens JWT para la autenticacion. Cuando un usuario inicia sesion, recibe un token que debe incluir en el header `Authorization` de sus peticiones posteriores.

### Integracion con Google OAuth
Se permite el inicio de sesion mediante Google. El backend valida el token enviado por el frontend contra los servidores de Google para autenticar de forma segura al usuario.

---

## Base de Datos y Persistencia

Se utiliza SQLite por su simplicidad y nulo mantenimiento en entornos de trafico moderado.
- **ORM**: SQLAlchemy.
- **Migraciones**: Los modelos se sincronizan automaticamente al iniciar la aplicacion si la tabla no existe.

---

## Endpoints Principales

- `POST /api/v1/login`: Autenticacion de usuario.
- `POST /api/v1/register`: Creacion de cuenta.
- `GET /api/v1/patients`: Obtencion de la lista de pacientes.
- `POST /api/v1/process-audio`: Envio de grabacion de voz para conversion a comandos dentales.
