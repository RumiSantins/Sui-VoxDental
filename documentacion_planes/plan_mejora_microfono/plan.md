# Plan de Corrección: Fallo de Micrófono en Dispositivos Móviles

## Diagnóstico
El problema se debe a una **acumulación de instancias de `AudioContext`**. En el archivo `voxdental/frontend/src/hooks/useSpeech.js`, la función `setupVAD` crea un `new AudioContext()` cada vez que se detecta silencio y se reinicia el ciclo de grabación. 
Los navegadores móviles bloquean la creación de nuevos contextos de audio tras alcanzar un límite pequeño (fuga de memoria/recursos).

## Pasos para la Implementación (Gemini Antigravity)

### 1. Refactorización de `useSpeech.js`
Se debe modificar el ciclo de vida de los objetos de audio para que sean persistentes durante toda la sesión de "Modo Continuo".

#### Cambios sugeridos en `startRecording`:
- Mover la inicialización del `AudioContext` fuera de `setupVAD`.
- Crear el `AudioContext`, `Analyser` y `Source` solo si no existen o si están cerrados.
- **Importante:** Llamar a `audioContext.resume()` inmediatamente después de su creación o al reutilizarlo, dentro del flujo disparado por el clic del usuario.

#### Cambios sugeridos en `stopRecordingLogic(false)`:
- Esta función (que se llama al detectar silencio) actualmente detiene el `MediaRecorder` pero deja huérfano el `AudioContext`.
- Se debe asegurar que el `AudioContext` no se recree en el siguiente `startRecording`, sino que se mantenga el mismo.

#### Cambios en `stopMicrophoneLogic`:
- Asegurar que `audioContext.close()` se ejecute correctamente y que todas las referencias se limpien (`null`).

### 2. Optimización para Navegadores Móviles
- Añadir un manejo de errores específico para el caso donde `getUserMedia` es bloqueado por el sistema tras varios fallos.
- Implementar un "Reset" manual del stream de audio si se detecta que el `volume` permanece en 0 por más de 3 segundos mientras `isRecording` es true.

### 3. Verificación
- Abrir la consola de desarrollador en Chrome (inspeccionando el dispositivo móvil).
- Monitorear el número de `AudioContext` activos.
- Confirmar que tras 20 o 30 ciclos de voz, el contador de contextos se mantiene en 1.

## Archivos a Modificar
- `voxdental/frontend/src/hooks/useSpeech.js`

---
*Este plan está diseñado para ser ejecutado de forma quirúrgica sobre la lógica de hooks de React.*
