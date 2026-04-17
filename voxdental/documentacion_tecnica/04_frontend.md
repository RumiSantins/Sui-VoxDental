# Referencia Tecnica del Frontend

La interfaz de EgoS esta construida como una Single Page Application (SPA) utilizando React y Vite. Prioriza la velocidad de carga y una experiencia de usuario fluida para entornos clinicos.

## Estructura de Directorios

- `src/components/`: Componentes reutilizables de la interfaz.
- `src/context/`: Estados globales (Autenticacion, Idioma, Tema).
- `src/hooks/`: Logica personalizada (useSpeech para el manejo de voz).
- `src/translations.js`: Diccionario centralizado de internacionalizacion.

---

## Sistema de Diseño y Marca (EgoS)

EgoS utiliza un diseño basado en contrastes limpios y fuentes legibles (como Inter y JetBrains Mono).

### Presentacion de Marca
El componente `EgoSHome.jsx` gestiona la bienvenida y la presentacion de la plataforma. Ha sido diseñado para ser la puerta de entrada, permitiendo el acceso a extensiones especializadas como VoxDental.

### Navegacion y Rutas
Se utiliza `react-router-dom` para la navegacion interna. Las rutas principales incluyen:
- `/`: Inicio y presentacion (EgoS).
- `/login`: Formulario de acceso.
- `/register`: Registro de nuevos especialistas.
- `/verify`: Flujo de verificacion de correo.

---

## Gestion de Estados (Contextos)

### AuthContext
Controla la sesion del usuario, el almacenamiento del token JWT en el LocalStorage y el refresco de la informacion del perfil.

### LanguageContext
Permite cambiar el idioma de la aplicacion de forma instantanea sin recargar la pagina, leyendo desde `translations.js`.

---

## Caracteristicas Especiales

### Reconocimiento de Voz
La interfaz incluye un componente de Odontograma interactivo que se alimenta de la voz del usuario. Se gestiona mediante el hook `useSpeech.js`, el cual captura el audio del microfono y lo envia al backend para su procesamiento.

### Modo Oscuro
EgoS cuenta con un sistema de modo oscuro integrado que se persiste en las preferencias del navegador del usuario.
