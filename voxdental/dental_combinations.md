# Guía Maestra de Combinaciones Dentales

Esta guía contiene todas las combinaciones posibles aceptadas por el procesador de lenguaje natural de Sui-VoxDental.

## Formatos Soportados
*   **Natural**: `[Pieza] [Condición] [Superficie]` o `[Condición] [Pieza] [Superficie]`
*   **Acrónimos**: `[Acrónimo] [Pieza]` (Ej: `RM 14` para Resina Mesial en el 14)

---

## 1. Cuadrantes y Piezas (32 total)
*   **Superior Derecho (1x)**: 11, 12, 13, 14, 15, 16, 17, 18
*   **Superior Izquierdo (2x)**: 21, 22, 23, 24, 25, 26, 27, 28
*   **Inferior Izquierdo (3x)**: 31, 32, 33, 34, 35, 36, 37, 38
*   **Inferior Derecho (4x)**: 41, 42, 43, 44, 45, 46, 47, 48

---

## 2. Condiciones y Superficies

### Patologías y Tratamientos
| Condición | Acrónimo | Superficies Aplicables |
| :--- | :--- | :--- |
| **Caries** | `C` | Oclusal, Incisal, Mesial, Distal, Vestibular, Palatina, Lingual |
| **Resina** | `R` | Oclusal, Incisal, Mesial, Distal, Vestibular, Palatina, Lingual |
| **Amalgama** | `A` | Oclusal, Incisal, Mesial, Distal, Vestibular, Palatina, Lingual |
| **Endodoncia** | `E` | N/A (Toda la pieza) |
| **Extracción** | `EX` | N/A (Toda la pieza) |
| **Corona** | `CR` | N/A (Toda la pieza) |
| **Ausente** | `X` | N/A (Toda la pieza) |
| **Borrar** | `B` | N/A (Limpia la pieza) |

---

## 3. Todas las Combinaciones (Ejemplos por Pieza)

Debido a que existen más de 1,700 combinaciones exactas, aquí se presentan los patrones raíz aplicables a cada uno de los 32 dientes.

### Patrón A: Hallazgos con Superficie
*(Válido para: Caries, Resina, Amalgama)*

**Ejemplo con el Diente 14:**
1.  `14 caries oclusal` (o `CO 14`)
2.  `14 caries incisal` (o `CI 14`)
3.  `14 caries mesial` (o `CM 14`)
4.  `14 caries distal` (o `CD 14`)
5.  `14 caries vestibular` (o `CV 14`)
6.  `14 caries palatina` (o `CP 14`)
7.  `14 caries lingual` (o `CL 14`)

*(Repetir lo mismo para Resina `R` y Amalgama `A` en los 32 dientes)*

### Patrón B: Hallazgos Globales
*(Válido para: Endodoncia, Ausente, Corona, Extraer)*

**Ejemplo con el Diente 26:**
1.  `26 endodoncia` (o `E 26`)
2.  `26 ausente` (o `X 26`)
3.  `26 corona` (o `CR 26`)
4.  `26 extraer` (o `EX 26`)

---

## 4. Listado Exhaustivo por Cuadrante (Resumen)

### Cuadrante 1 (Superior Derecho)
- **11**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- **12**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- ... (Sigue el mismo patrón hasta 18)

### Cuadrante 2 (Superior Izquierdo)
- **21**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- **22**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- ... (Sigue el mismo patrón hasta 28)

### Cuadrante 3 (Inferior Izquierdo)
- **31**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- **32**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- ... (Sigue el mismo patrón hasta 38)

### Cuadrante 4 (Inferior Derecho)
- **41**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- **42**: Caries [O,I,M,D,V,P,L], Resina [O,I,M,D,V,P,L], Amalgama [O,I,M,D,V,P,L], E, X, CR, EX, B
- ... (Sigue el mismo patrón hasta 48)

---

## 5. Comandos de Sistema
- `sui fuera`: Detiene el sistema de reconocimiento de voz.
- `borrar 14`: Limpia todos los hallazgos de esa pieza.
