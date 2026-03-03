

## Plan: Prevenir que el sandbox deje de cargar por errores no capturados

### Diagnóstico
No hay errores visibles en consola, lo que sugiere que una **promesa rechazada sin capturar** (unhandled rejection) está crasheando React y dejando la pantalla en blanco. El proyecto no tiene:
1. **Error Boundary** de React — si un componente lanza un error durante el render, toda la app muere sin recuperación.
2. **`event.preventDefault()`** en el handler de `unhandledrejection` — el logger actual registra el error pero no lo suprime, permitiendo que el navegador lo trate como fatal.

### Cambios propuestos

#### 1. Crear un Error Boundary global (`src/components/ErrorBoundary.tsx`)
- Componente de clase React que captura errores de rendering.
- Muestra un fallback amigable con botón "Recargar" en vez de pantalla blanca.
- Loguea el error via `window.favoronLogError`.

#### 2. Envolver la app con el Error Boundary (`src/main.tsx`)
- Wrappear `<App />` con `<ErrorBoundary>`.

#### 3. Suprimir unhandled rejections fatales (`src/lib/clientErrorLogger.ts`)
- Agregar `event.preventDefault()` en el listener de `unhandledrejection` para evitar que el navegador trate la promesa rechazada como error fatal.

#### 4. Agregar handler de unhandled rejections en App.tsx
- `useEffect` con listener `unhandledrejection` que muestra un toast de error y llama `event.preventDefault()` como red de seguridad adicional.

### Resultado
- Errores de rendering → fallback visual con opción de recargar (en vez de pantalla blanca).
- Promesas rechazadas → se loguean y suprimen sin crashear la app.
- El sandbox dejará de quedarse en blanco por errores no capturados.

