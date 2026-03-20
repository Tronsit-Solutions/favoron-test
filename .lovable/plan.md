

## Mostrar Tip Boost en Detalles de Viaje y Preview Cards

### Cambios

**1. `src/components/admin/TripDetailModal.tsx`** — Agregar sección de Tip Boost después del bloque de "Información Adicional" (~línea 598):
- Mostrar un bloque visual (fondo amber) con icono Rocket si `trip.boost_code` existe
- Mostrar el código aplicado: `trip.boost_code`
- Si no hay boost, no mostrar nada
- Importar `Rocket` de lucide-react

**2. `src/components/admin/AdminApprovalsTab.tsx`** — En la preview card de viajes (~línea 395):
- Después del nombre del viajero, si `trip.boost_code` existe, mostrar un Badge amber: `🚀 Boost: {trip.boost_code}`

**3. `src/components/admin/matching/TripCard.tsx`** — Ya tiene prop `hasBoost` y badge implementado (de cambios anteriores). No requiere cambios.

### Datos
El campo `boost_code` ya existe en la tabla `trips` y ya se incluye en los queries de `useOptimizedTripsData` y `useTripsData`. Solo necesitamos verificar que los datos de `AdminApprovalsTab` también lo incluyan.

