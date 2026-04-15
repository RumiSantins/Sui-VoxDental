# Guía Definitiva de Despliegue - VoxDental GCP

Esta guía contiene las instrucciones exactas que funcionan para tu entorno (Windows + Git Bash + GCP). **No modificar sin validación previa.**

## PARTE 1: Construcción y Subida (Desde tu PC)

### 1. Entorno de Ejecución
- **Terminal:** Utilizar SIEMPRE **Git Bash**. No utilizar PowerShell ni CMD para el script de despliegue.
- **Ruta Local:** `C:/apps/Sui/voxdental`

### 2. Comandos de Despliegue
Ejecuta estos comandos en Git Bash:
```bash
cd /c/apps/Sui/voxdental
./deploy-gcp.sh
```

### 3. Solución de Problemas Comunes (Fix Python/gcloud)
Si el comando falla diciendo que no encuentra Python o abre la Microsoft Store:
1. Ir a **"Alias de ejecución de aplicaciones"** en la configuración de Windows.
2. Desactivar los interruptores para `python.exe` y `python3.exe`.
3. Reiniciar Git Bash.

---

## PARTE 2: Actualización del Servidor (En la Nube)

Una vez que el script local termine de subir las imágenes (`Imagenes subidas exitosamente!`), sigue estos pasos:

### 1. Conexión SSH
Conéctate a tu instancia de Compute Engine (`voxdental-server`).

### 2. Comandos en el Servidor
Ejecuta estos comandos exactamente en este orden:
```bash
# Ir a la carpeta del proyecto
cd /home/rumisanz_04_se/

# Descargar las imágenes recién subidas
docker-compose pull

# Reiniciar los contenedores con la nueva versión
docker-compose up -d
```

### 3. Verificación
Verifica que los contenedores estén corriendo:
```bash
docker ps
```
*Debes ver `voxdental_frontend` y `voxdental_backend` con el estado "Up".*

---

## Notas de Seguridad
- La rama principal de despliegue es **`master`**.
- Asegúrate de tener Docker Desktop corriendo en tu PC antes de iniciar el proceso.
- Si el disco del servidor se llena, usa `docker system prune -f` para limpiar imágenes antiguas.
