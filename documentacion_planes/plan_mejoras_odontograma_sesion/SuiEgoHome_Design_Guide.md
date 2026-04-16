# Guía de Diseño: SuiEgoHome
**Componente:** `voxdental/frontend/src/components/SuiEgoHome.jsx`
**Estilo:** Technical Minimalism & Chronological Interface

---

## 1. Sistema de Color

### Modo Claro (Light Mode)
| Rol | Valor |
|---|---|
| Fondo principal | `#FFFFFF` |
| Fondo superficie (cards, header) | `#F7F7F7` |
| Texto principal | `#111111` |
| Texto secundario | `#666666` |
| Texto terciario / metadatos | `#999999` |
| Borde sutil | `rgba(0,0,0,0.08)` |
| Borde énfasis | `rgba(0,0,0,0.14)` |

### Modo Oscuro (Dark Mode)
| Rol | Valor |
|---|---|
| Fondo principal | `#0B0B0B` |
| Fondo superficie (cards, header) | `#141414` |
| Texto principal | `#E1E1E1` |
| Texto secundario | `#888888` |
| Texto terciario / metadatos | `#555555` |
| Borde sutil | `rgba(255,255,255,0.07)` |
| Borde énfasis | `rgba(255,255,255,0.13)` |

### Badges de Estado (ambos modos)
Estos colores NO cambian entre modos; mantienen el color semántico siempre.
| Tipo | Fondo | Borde | Texto |
|---|---|---|---|
| `Active` / `Added` | `#EBF9F2` | `#27AE60` | `#1A7A42` |
| `Improved` | `#EBF4FD` | `#2980B9` | `#1A5F8A` |
| `Changed` | `#FEF9EC` | `#D4A017` | `#9A6E00` |
| `Fixed` | `#FDECEC` | `#C0392B` | `#8B2318` |
| `Próximamente` | `#F3F3F3` | `#CCCCCC` | `#777777` |

> En modo oscuro, los badges deben reducir la opacidad del fondo al 15%
> usando la misma lógica: `active` → `rgba(39,174,96,0.12)`, etc.

---

## 2. Tipografía

### Fuentes requeridas
```
DM Sans         → Títulos y cuerpo (weights: 400 Regular, 600 Semi-bold)
JetBrains Mono  → Metadatos, versiones, etiquetas técnicas (weights: 400, 500)
```
Importar en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
```

### Jerarquía tipográfica
| Elemento | Fuente | Tamaño | Peso | Color |
|---|---|---|---|---|
| Logotipo "SuiEgo" | DM Sans | 18px | 600 | Texto principal |
| Extensión "· VoxDental" | JetBrains Mono | 13px | 400 | Texto secundario |
| Título Hero | DM Sans | 36px (móvil: 26px) | 600 | Texto principal |
| Subtítulo Hero | DM Sans | 16px | 400 | Texto secundario |
| Versión / Fecha | JetBrains Mono | 12px | 400 | Texto terciario |
| Nombre de módulo | DM Sans | 17px | 600 | Texto principal |
| Descripción de módulo | DM Sans | 14px | 400 | Texto secundario |
| Metadato técnico | JetBrains Mono | 12px | 400 | Texto terciario |

---

## 3. Layout y Estructura

- **Columna única centrada**, `max-width: 800px`, con padding horizontal de `24px`.
- Sin sombras. Sin degradados. Sin relieves.
- Separaciones entre secciones mediante línea `1px` con `rgba(0,0,0,0.08)` en claro / `rgba(255,255,255,0.07)` en oscuro.
- Espaciado vertical entre secciones: `80px`.
- Espaciado interno entre entradas del timeline: `64px`.

---

## 4. Secciones y Contenido

### 4.1 Header
- **Posición:** Sticky top, fondo superficie (`#F7F7F7` / `#141414`), borde inferior de `1px`.
- **Altura:** `56px`.
- **Izquierda:**
  - Texto `SuiEgo` en DM Sans 18px/600, color texto principal.
  - Seguido de separador `·` y texto `VoxDental` en JetBrains Mono 13px/400, color texto secundario.
- **Derecha:**
  - Botón `Iniciar sesión` → estilo outline: fondo transparente, borde `1px` color texto secundario, texto secundario, 12px/400 DM Sans. Sin border-radius exagerado: `4px`.
  - Botón `Registrarse` → estilo sólido: fondo texto principal, texto fondo principal, 12px/600 DM Sans, `border-radius: 4px`.
  - Toggle modo oscuro/claro → ícono SVG simple (sol / luna), `20px`, color texto secundario. Sin fondo ni borde. Separado de los botones por `16px`.
- **Transición del toggle:** `150ms linear` en `background-color` y `color`.

---

### 4.2 Hero Section
- **Padding top:** `96px`. **Padding bottom:** `80px`.
- **Etiqueta superior** (sobre el título):
  - Texto en JetBrains Mono 11px/400: `v1.1.0 — Sistema activo`
  - Color: texto terciario.
  - Margen inferior: `24px`.
- **Título principal:**
  - `"SuiEgo: Inteligencia con Alma. Tecnología para la Vida."`
  - DM Sans 36px/600, color texto principal, `line-height: 1.2`.
- **Subtítulo:**
  - `"Donde la precisión de Ego se encuentra con la fluidez de Sui para transformar la consulta dental."`
  - DM Sans 16px/400, color texto secundario, `line-height: 1.6`, margen top `16px`, `max-width: 580px`.
- **Separador inferior:** línea `1px` al ancho completo de la columna.

---

### 4.3 Timeline de Módulos / Sectores
- **Título de sección:**
  - JetBrains Mono 11px/400, texto terciario, `letter-spacing: 0.08em`, en mayúsculas: `EXTENSIONES DEL ECOSISTEMA`.
  - Margen inferior: `48px`.
- **Estructura de cada entrada:**
  - Línea vertical de `1px` pegada a la izquierda, color borde sutil, altura completa de la entrada.
  - Punto de `6px` de diámetro sobre la línea, color texto terciario (activo: color verde `#27AE60`).
  - Contenido desplazado `24px` a la derecha de la línea.
- **Campos por entrada:**
  1. **Metadato:** JetBrains Mono 11px/400, texto terciario. Ej: `módulo/dental — 2025`.
  2. **Nombre del módulo:** DM Sans 17px/600, texto principal. Margen top: `4px`.
  3. **Descripción:** DM Sans 14px/400, texto secundario, `line-height: 1.6`. Margen top: `8px`.
  4. **Badge de estado:** Ver especificación de badges, justo debajo de la descripción. Margen top: `12px`.

#### Entradas del timeline:
1. **SuiVoxDental** — `módulo/dental · odontología clínica`
   - Descripción: `"Captura de odontograma y registros clínicos mediante entrada por voz. Integración directa con flujo de consulta dental."`
   - Badge: `Active` (verde)

2. **SuiCardio** — `módulo/cardio · próximamente`
   - Descripción: `"Extensión del núcleo SuiEgo hacia el registro clínico cardiovascular."`
   - Badge: `Próximamente` (gris)

3. **SuiDerma** — `módulo/derma · próximamente`
   - Descripción: `"Registro y seguimiento dermatológico con soporte de descripción por voz."`
   - Badge: `Próximamente` (gris)

4. **SuiVet** — `módulo/vet · próximamente`
   - Descripción: `"Rama veterinaria. Un guiño al origen de SuiEgo: los gatos Sui y Ego."`
   - Badge: `Próximamente` (gris)

---

### 4.4 Sección "Nuestra Historia"
- **Separador superior:** línea `1px`.
- **Etiqueta:** JetBrains Mono 11px/400, texto terciario, mayúsculas: `ORIGEN`.
- **Título:** DM Sans 22px/600, texto principal: `"El nombre tiene historia."`
- **Cuerpo** (DM Sans 15px/400, texto secundario, `line-height: 1.75`, `max-width: 600px`):

  > SuiEgo nace de dos gatos: Sui y Ego. Sui representa la fluidez, la intuición y la escucha — el motor de voz que transforma palabras en datos. Ego representa la estructura, la identidad clínica y la precisión — la base que valida y organiza el conocimiento médico.
  >
  > Juntos, forman un sistema con carácter: diseñado para escuchar, entender y crecer junto a los profesionales de la salud.

- Separador inferior: línea `1px`.

---

### 4.5 Footer
- **Padding:** `40px 0`.
- **Izquierda:** JetBrains Mono 11px/400, texto terciario: `© 2025 SuiEgo · Todos los derechos reservados`.
- **Derecha:** JetBrains Mono 11px/400, texto terciario: `v1.0.0`.

---

## 5. Interacción y Movimiento

- **Todas las transiciones:** `150ms` con curva `linear` o `ease-out`. Sin bounce.
- **Hover en botones:** opacidad `0.75` en outline, opacidad `0.85` en sólido.
- **Hover en entradas del timeline:** el punto lateral cambia de `#999` a `#111` (claro) / `#E1E1E1` (oscuro). Transición `150ms linear`.
- **Toggle de modo:** la transición de `background-color` y `color` debe aplicarse al `body` o contenedor raíz, no solo a elementos individuales.
- **Sin animaciones de entrada, parallax ni efectos decorativos.**

---

## 6. Implementación del Toggle Dark/Light

El estado del modo se gestiona con `useState`. Al montar el componente, leer la preferencia del sistema con `window.matchMedia('(prefers-color-scheme: dark)')` como valor inicial. Persistir la selección del usuario en `localStorage` bajo la clave `suiego-theme`.

Aplicar los colores mediante un objeto de estilos dinámico que se recalcula según el estado `isDark`, pasándolo como `style` al contenedor raíz del componente.

---

## 7. Notas de Implementación

- El componente debe ser **completamente autocontenido**: todos los estilos en línea o en un módulo CSS local. No depender de clases globales de Tailwind o Bootstrap para la paleta.
- Respetar el `max-width: 800px` en todas las secciones. El Header puede ser full-width pero su contenido interior debe estar centrado a `800px`.
- La línea vertical del timeline debe ser un `div` con `width: 1px` posicionado de forma absoluta respecto a su contenedor padre relativo.
- En móvil (`< 640px`): reducir el título Hero a `26px`, el padding lateral a `16px` y ocultar el metadato del footer derecho.
