# Plan de Mejora: NLP y Reconocimiento de Voz

Este plan corrige los errores de detección de comandos clínicos y mejora la interpretación de la numeración de piezas dentales.

## 1. Correcciones Fonéticas y Ortográficas (Backend)
Modificar `voxdental/src/core/nlp.py` para incluir los siguientes mapeos en `normalize_text`:
- **Condiciones**:
    - `"aucente"`, `"ausencia"`, `"ausente"` -> Mapear a comando **X** (Ausente).
    - `"amalgaba"`, `"al magma"`, `"un magma"` -> Mapear a comando **A** (Amalgama).
    - `"resina"`, `"recina"` -> Mapear a comando **R** (Resina).
- **Números**:
    - `"onze"`, `"onza"`, `"once"` -> **11**.
    - `"doce"`, `"dose"` -> **12**.

## 2. Nueva Lógica de Numeración "Dos Seis"
Implementar un pre-procesador en `normalize_text` que identifique pares de números hablados:
- Buscar patrones de dígitos individuales seguidos (ej: `"2 6"`, `"1 8"`, `"4 3"`).
- Convertirlos en el número de pieza correspondiente si el resultado está entre 11 y 48 (excluyendo terminaciones en 0 o 9 según norma FDI).
- **Ejemplo**: `"Resina mesial dos seis"` -> `"resina mesial 26"`.

## 3. Desactivación de "X Punto Y"
- Reducir la prioridad o eliminar el regex que busca `"punto"` entre números para evitar falsos positivos si el usuario ya no usa esa convención.
- Mantener solo la detección de dígitos pegados o con espacio simple.

## 4. Mejora del Mapeo de Intenciones
- Asegurar que si el sistema detecta `"Resina"` y `"16"`, asuma automáticamente la cara por defecto (Oclusal/Incisal) si no se menciona una, en lugar de marcar error por falta de superficie.

## Pasos para la Ejecución
1. Modificar `voxdental/src/core/nlp.py`.
2. Actualizar `voxdental/src/core/validator.py` si es necesario para validar las nuevas combinaciones.
3. Realizar pruebas con las frases de error reportadas:
    - *"Resina mesial 16"* -> **R M 16**
    - *"Caries distal onze"* -> **C D 11**
    - *"Aucente 27"* -> **X 27**
    - *"Amalgaba mesial 26"* -> **A M 26**

---
*Este plan garantiza que el sistema sea más tolerante a errores de pronunciación y se adapte al lenguaje natural de los odontólogos.*
