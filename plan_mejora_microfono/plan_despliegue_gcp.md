# Plan de Despliegue a GCP (Producción)

Este plan detalla los pasos para subir la aplicación corregida a Google Cloud Platform utilizando la configuración existente.

## Requisitos Previos
1. Que el agente **Gemini Antigravity** haya aplicado los cambios en `voxdental/frontend/src/hooks/useSpeech.js` según el plan de mejora del micrófono.
2. Tener instalado y configurado el **Google Cloud SDK (gcloud)** en tu terminal local.

## Pasos para la Ejecución

### 1. Preparación del Envornon
Asegúrate de estar en la rama correcta y de que no haya conflictos:
```bash
git checkout master
git pull origin master
```

### 2. Ejecución del Script de Despliegue
Navega a la carpeta del backend/raíz y ejecuta el script automatizado.

**Si estás en Linux/Mac/Git Bash:**
```bash
cd voxdental
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

**Si estás en Windows (PowerShell):**
```powershell
cd voxdental
sh deploy-gcp.sh
```
*Este script se encarga de: Construir las imágenes de Docker (Frontend y Backend), subirlas a Artifact Registry y actualizar el servicio en Cloud Run.*

### 3. Verificación Post-Despliegue
Una vez el script termine con éxito (debería darte la URL de GCP), realiza las siguientes pruebas en un **dispositivo móvil real**:
1. Entra a la URL de producción.
2. Abre la consola de depuración si es posible (o usa el modo "Inspeccionar" de Chrome conectado por USB).
3. Realiza al menos **15 capturas de voz seguidas**.
4. Verifica que el icono del micrófono (o el volumen) siga respondiendo después de la décima captura.

## Notas Técnicas
- El script `deploy-gcp.sh` utiliza el archivo `docker-compose.yml` o los `Dockerfile` individuales según tu configuración. 
- Si el despliegue falla por "Quota Exceeded", asegúrate de limpiar imágenes antiguas en GCP Artifact Registry.

---
*Este plan garantiza que la corrección del audio llegue a tus usuarios finales sin afectar la estabilidad actual.*
