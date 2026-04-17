# SuiEgo Platform

SuiEgo es una plataforma centralizada de servicios de salud inteligente, diseñada para gestionar flujos clinicos complejos mediante el uso de inteligencia artificial y procesamiento de voz en tiempo real.

Este repositorio alberga el nucleo de SuiEgo y su extension especializada Sui-VoxDental, un sistema de odontograma interactivo manos libres.

---

## Documentacion Tecnica Integral

Para facilitar la comprension y el mantenimiento del proyecto, se ha generado una documentacion detallada dividida por modulos. Se recomienda comenzar por el indice principal:

**[Acceder al Indice de Documentacion](documentacion_tecnica/00_indice.md)**

La documentacion incluye:
- Arquitectura de Sistemas y Flujo de Datos.
- Guia de Instalacion y Desarrollo Local.
- Manual de Despliegue en GCP y Mantenimiento de Produccion (SSL, Nginx).
- Referencia Tecnica del Frontend (React).
- Referencia Tecnica del Backend (FastAPI).

---

## Estructura del Proyecto

El proyecto se organiza en dos servicios principales orquestados por Docker:

- **Frontend**: Aplicacion React optimizada con Vite, encargada de la interfaz de usuario y la captura de voz.
- **Backend**: API construida con FastAPI que gestiona la logica de negocio, autenticacion y procesamiento STT (Speech-to-Text).

```text
voxdental/
├── src/                <-- Codigo fuente del Backend (Python)
├── frontend/           <-- Codigo fuente del Frontend (React)
├── documentacion_tecnica/ <-- Guías detalladas del proyecto
├── static/             <-- Recursos estaticos
├── Dockerfile          <-- Configuracion de imagen para Backend
├── docker-compose.yml  <-- Orquestacion de servicios
└── suiego.db           <-- Base de datos principal (SQLite)
```

---

## Creditos y Desarrollo

Plataforma desarrollada por el equipo de SuiEgo. 
Desarrollador Principal: Felipe Santillan.
Colaboracion: Fausto Software.
