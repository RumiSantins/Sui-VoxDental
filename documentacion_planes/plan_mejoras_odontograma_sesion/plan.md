# Plan de Mejoras: Odontograma y Gestión de Sesión

Este plan describe las modificaciones necesarias para mejorar la precisión clínica, la coherencia visual y la experiencia de usuario en la sesión.

## 1. Validación Clínica de Superficies
**Problema:** El sistema permite agregar procedimientos en caras que ciertos dientes no tienen (ej. oclusal en un incisivo).
**Acción:**
- Crear un mapa de configuración en el frontend (`src/utils/toothConfig.js` o similar) que defina las caras válidas para cada grupo de dientes (Incisivos, Caninos, Premolares, Molares).
- En el proceso de captura (Voz y Manual), agregar un check: `if (!isSurfaceValid(tooth, surface)) { showWarning("Este diente no posee esa cara"); return; }`.
- Implementar un componente de notificación (Toast) para avisar al usuario sin interrumpir el flujo.

## 2. Coherencia en Estado de Extracción
**Problema:** Los dientes marcados para extracción se ven naranjas en el odontograma pero blancos en el modal interno.
**Acción:**
- Revisar `ToothSVG.jsx` y el modal de detalle (probablemente `ClinicalRecordModal.jsx` u `OdontogramView.jsx`).
- Asegurar que el modal reciba el estado completo del diente (incluyendo el flag `to_extract`) y aplique los mismos estilos CSS que la vista general.
- Unificar la constante de color para "Extracción" en un solo lugar para evitar discrepancias.

## 3. Sesión Persistente con Timeout de Inactividad (20 min)
**Problema:** La sesión se cierra de forma inesperada o demasiado pronto.
**Acción:**
- Modificar `AuthContext.jsx`.
- Implementar un `idleTimer`:
    - Escuchar eventos globales: `mousedown`, `keydown`, `touchstart`, `scroll`.
    - Cada evento debe resetear un temporizador de 20 minutos.
    - Si el temporizador llega a cero, ejecutar `logout()`.
- **Backend:** Asegurar que el token JWT tenga una duración mayor (ej. 24 horas) para que el control de la sesión resida principalmente en la actividad real del usuario en el frontend.

## Archivos a Modificar
- `voxdental/frontend/src/context/AuthContext.jsx` (Sesión)
- `voxdental/frontend/src/components/ToothSVG.jsx` (Visualización)
- `voxdental/frontend/src/components/ClinicalRecordModal.jsx` (Sincronización y Avisos)
- `voxdental/frontend/src/hooks/useSpeech.js` (Validación de voz)

---
*Este plan busca profesionalizar el comportamiento clínico de la aplicación y evitar frustraciones por cierres de sesión inesperados.*
