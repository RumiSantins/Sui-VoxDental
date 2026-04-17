# Manual de Despliegue y Produccion

Este documento describe el flujo de operacion para mantener y actualizar el sistema EgoS en el servidor de produccion alojado en Google Cloud Platform.

## Infraestructura en la Nube

El sistema reside en una instancia de Google Compute Engine (VM) bajo el nombre `voxdental-server`. No se utilizan servicios gestionados (PaaS) para el backend o la DB, lo que reduce costos y centraliza el control.

---

## Flujo de Actualizacion

Para subir cambios nuevos al servidor, se debe seguir estrictamente este orden:

### 1. Preparacion en Local
Desde tu computadora, asegura que el codigo este en la rama principal (`master`) y que las imagenes de Docker esten construidas y subidas al registro de Google (GCR):
```bash
git push origin master
bash deploy-gcp.sh
```

### 2. Actualizacion en el Servidor (SSH)
Entra al servidor mediante SSH y actualiza los contenedores:
```bash
# Sincronizar codigo (si aplica)
git pull origin master

# Descargar las nuevas imagenes y reiniciar servicios
docker-compose pull
docker-compose up -d --remove-orphans
```

---

## Configuracion de Dominios y SSL

### Uso de nip.io
Debido a que no se cuenta con un dominio fijo adquirido en esta etapa, se utiliza el servicio `nip.io`. Este servicio mapea la IP publica `35.202.203.240` a nombres de dominio plenamente funcionales:
- **Frontend**: `EgoS.35.202.203.240.nip.io`
- **Backend**: `api.EgoS.35.202.203.240.nip.io`

### Gestion de Certificados (Certbot)
El servidor utiliza Certbot con el plugin de Nginx para mantener los certificados de Let's Encrypt.
- **Ubicacion de archivos**: `/etc/letsencrypt/live/`
- **Comando de renovacion manual**: `sudo certbot renew`
- **Configuracion de Nginx**: `/etc/nginx/sites-available/EgoS`

---

## Mantenimiento de la Base de Datos

La base de datos SQLite se almacena en el archivo `EgoS.db` en la raiz del proyecto del servidor. 
- **Respaldo**: Se recomienda realizar copias periodicas de este archivo.
- **Persistencia**: El archivo esta mapeado mediante un volumen de Docker, por lo que los datos no se pierden al reiniciar o actualizar los contenedores.

## Monitoreo Basico
Para revisar si los servicios estan corriendo correctamente, utiliza:
```bash
docker ps
docker logs EgoS_backend --tail 50
```
