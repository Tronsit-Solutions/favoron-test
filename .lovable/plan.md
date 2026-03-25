
Objetivo: hacer que, al confirmar un match exitoso, la tarjeta salga inmediatamente de la pestaña “Solicitudes” o muestre un estado transitorio claro, sin depender de hard refresh.

1. Corregir el flujo de éxito en `src/components/AdminDashboard.tsx`
- Cambiar `handleMatch` para no mostrar éxito antes de que termine `onMatchPackage`.
- Reemplazar el patrón actual “optimistic update + toast inmediato + fire-and-forget” por:
  - marcar el paquete como `isMatching` localmente,
  - deshabilitar acciones mientras corre la asignación,
  - esperar `await onMatchPackage(...)`,
  - solo entonces cerrar modal/mostrar toast.
- Si falla, limpiar `isMatching` y mantener la tarjeta en “Solicitudes”.

2. Agregar estado local transitorio por paquete en admin
- Introducir un estado tipo `matchingPackageIds` o `pendingMatchMap` en `AdminDashboard`.
- Usarlo para:
  - ocultar de inmediato el paquete de la lista de pendientes, o
  - preferiblemente mostrar una versión “Asignando...” mientras se confirma.
- Este estado debe limpiarse cuando:
  - la RPC termina con éxito, o
  - ocurre error y se revierte.

3. Evitar que el sync de props sobrescriba el estado reciente
- Ajustar el `useEffect` de sincronización en `AdminDashboard` que hoy hace `setLocalPackages(packages)` al cerrar modales.
- Añadir una protección temporal para paquetes recién mutados localmente, similar al patrón ya existente de `recentMutationsRef`.
- Así evitamos que un `packages` prop todavía stale vuelva a meter el paquete en “Solicitudes”.

4. Hacer que la tarjeta desaparezca correctamente de “Solicitudes”
- Revisar `src/components/admin/AdminMatchingTab.tsx` y `src/components/admin/matching/PendingRequestsTab.tsx`.
- Excluir de `pendingRequests` no solo por `status`, sino también por el estado local transitorio (`isMatching` / `pending match`).
- Opcional UX mejor: si el paquete está en transición, mostrar badge “Asignando viajeros...” y spinner en vez de acciones.

5. Mantener consistencia con realtime/admin merge
- Conectar el cambio con la arquitectura actual de admin realtime:
  - no depender únicamente del update incremental de `packages`,
  - preservar relaciones/datos existentes al aplicar el estado local.
- Si el match fue exitoso, el paquete debe quedar en `matched` en `localPackages` hasta que llegue el sync real, nunca volver momentáneamente a `approved`.

6. Validación esperada
- Caso 1: match a 1 viajero
  - la tarjeta sale de “Solicitudes” inmediatamente,
  - aparece en “Matches” sin refresh.
- Caso 2: match a varios viajeros
  - mismo comportamiento inmediato.
- Caso 3: error RPC
  - no se muestra éxito,
  - la tarjeta sigue en “Solicitudes”,
  - se muestra error claro.

Detalles técnicos
- Archivos a tocar:
  - `src/components/AdminDashboard.tsx`
  - `src/components/admin/AdminMatchingTab.tsx`
  - `src/components/admin/matching/PendingRequestsTab.tsx`
- Causa raíz detectada:
  - el éxito se anuncia antes de terminar la operación real,
  - luego el `useEffect` de sincronización reaplica `packages` stale,
  - por eso parece que “no se hizo” hasta hacer hard refresh.
- Enfoque recomendado:
  - usar `await` para la operación crítica,
  - usar estado transitorio local explícito,
  - proteger el merge/sync contra sobrescrituras prematuras.
