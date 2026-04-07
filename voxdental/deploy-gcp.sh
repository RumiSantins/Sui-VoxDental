#!/bin/bash
# ==============================================================
# Script de Despliegue a Google Cloud Platform (GCE con Docker)
# ==============================================================
# Uso: bash deploy-gcp.sh
#
# Prerequisitos:
#   1. gcloud CLI instalado y autenticado (gcloud auth login)
#   2. Docker instalado localmente
#   3. Proyecto de GCP configurado (gcloud config set project PROJECT_ID)
# ==============================================================

set -e

# --- CONFIGURACIÓN (Edita estos valores) ---
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/voxdental-backend"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/voxdental-frontend"
TAG="latest"

echo "=========================================="
echo " Sui VoxDental - Despliegue a GCP"
echo "=========================================="
echo "Proyecto: ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo ""

# --- Paso 1: Construir imágenes ---
echo "[1/4] Construyendo imagen del Backend..."
docker build -t ${BACKEND_IMAGE}:${TAG} -f Dockerfile .

echo "[2/4] Construyendo imagen del Frontend..."
docker build -t ${FRONTEND_IMAGE}:${TAG} -f frontend/Dockerfile frontend/

# --- Paso 2: Autenticar Docker con GCR ---
echo "[3/4] Autenticando Docker con Google Container Registry..."
gcloud auth configure-docker --quiet

# --- Paso 3: Subir imágenes ---
echo "[4/4] Subiendo imagenes a GCR..."
docker push ${BACKEND_IMAGE}:${TAG}
docker push ${FRONTEND_IMAGE}:${TAG}

echo ""
echo "=========================================="
echo " Imagenes subidas exitosamente!"
echo "=========================================="
echo ""
echo "Backend:  ${BACKEND_IMAGE}:${TAG}"
echo "Frontend: ${FRONTEND_IMAGE}:${TAG}"
echo ""
echo "Para desplegar en Compute Engine, ejecuta en tu VM:"
echo "  docker pull ${BACKEND_IMAGE}:${TAG}"
echo "  docker pull ${FRONTEND_IMAGE}:${TAG}"
echo "  docker-compose up -d"
echo ""
