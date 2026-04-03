
Objetivo: eliminar el error frecuente que manda al usuario a “Algo salió mal” al entrar a `/dashboard`, especialmente cuando Vite intenta cargar dinámicamente `src/pages/Dashboard.tsx`.

Qué confirmé
- El error actual no apunta a una excepción dentro del dashboard; apunta a un fallo de carga del módulo lazy:
  `Failed to fetch dynamically imported module: /src/pages/Dashboard.tsx?...`
- `src/App.tsx` carga `Dashboard` con `lazy(() => import("./pages/Dashboard"))` sin protección.
- Ya existe una solución parcial en `src/pages/Index.tsx`: un `lazyWithRetry(...)` pensado exactamente para fallos de chunks tras cambios de build.
- El `ErrorBoundary` actual captura el fallo, pero solo muestra la pantalla genérica; no intenta recuperación específica para errores de carga de chunks/módulos.

Diagnóstico
- Esto huele a fallo intermitente de lazy import por despliegue/caché/HMR del preview, no a un bug funcional del matching.
- Por eso “sucede mucho esto” incluso antes de usar la UI: el módulo de la ruta no llega a descargarse y React cae al boundary.

Plan de implementación
1. Centralizar un helper de lazy import resiliente
- Extraer la lógica de `lazyWithRetry` a un util compartido, por ejemplo `src/lib/lazyWithRetry.ts`.
- Agregar protección de “solo un reload automático por ruta/chunk” usando `sessionStorage`, para evitar loops infinitos.

2. Aplicarlo a las rutas lazy críticas
- Reemplazar en `src/App.tsx` los `lazy(() => import(...))` por `lazyWithRetry(() => import(...))`.
- Prioridad alta: `Dashboard`, `Operations`, y páginas admin.
- Así, si falla el import dinámico por un build desincronizado, la app hace una recuperación automática controlada antes de caer definitivamente.

3. Endurecer el ErrorBoundary para chunk/module load errors
- Detectar mensajes como:
  - `Failed to fetch dynamically imported module`
  - `Importing a module script failed`
  - `Loading chunk ... failed`
- Mostrar un mensaje más útil tipo “La aplicación se actualizó, estamos recargando”.
- Ofrecer recarga limpia solo si el auto-reintento ya falló.

4. Reducir la probabilidad en la ruta principal
- Evaluar dejar `src/pages/Dashboard.tsx` como import estático en `App.tsx` si es la ruta principal de usuarios autenticados.
- Mantener lazy solo en pantallas secundarias/pesadas.
- Esto elimina por completo el punto de falla más visible para la app.

5. Verificación
- Confirmar que entrar a `/dashboard?tab=admin&matching=matches` ya no termine en el ErrorBoundary por fallos de import.
- Verificar también refresh duro y navegación repetida entre auth/dashboard.
- Revisar que no haya loop de recarga si el import falla persistentemente.

Archivos a tocar
- `src/App.tsx`
- `src/lib/lazyWithRetry.ts` (nuevo helper compartido)
- `src/components/ErrorBoundary.tsx`
- opcionalmente `src/pages/Index.tsx` para reutilizar el helper nuevo y evitar lógica duplicada

Decisión técnica recomendada
- Mejor enfoque: combinar `lazyWithRetry` + guard de un solo reload + mejor manejo en `ErrorBoundary`.
- Si quieres máxima estabilidad para admins, la mejora adicional más fuerte es quitar el lazy de `Dashboard` por completo.

Resultado esperado
- Mucha menos frecuencia de la pantalla “Algo salió mal”.
- Recuperación automática cuando el preview/publicación queda con módulos desincronizados.
- Menor fricción al entrar al dashboard después de cambios o despliegues.
