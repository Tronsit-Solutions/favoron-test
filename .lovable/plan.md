

## Modificar lógica de visibilidad de viajes

Cambiar el filtro en `src/components/Dashboard.tsx` (líneas 268-274) para que:

- **`rejected` y `cancelled`**: se ocultan siempre (sin toggle)
- **`completed` y `completed_paid`**: se ocultan solo si `traveler_feedback_completed === true`
- **Eliminar el toggle** `hideInactiveTrips` y su Switch UI (ya no es necesario, la lógica es automática)

### Cambios

**`src/components/Dashboard.tsx`**:

1. **Líneas 268-274** — Reemplazar el filtro:
```ts
const filteredUserTrips = userTrips.filter(trip => {
  // Always hide rejected/cancelled
  if (trip.status === 'rejected' || trip.status === 'cancelled') return false;
  // Hide completed/completed_paid only after traveler completes feedback
  if ((trip.status === 'completed' || trip.status === 'completed_paid') && trip.traveler_feedback_completed) return false;
  return true;
});
```

2. **Eliminar el Switch UI** del toggle "Ocultar inactivos" (~líneas 750-764) y el `useStickyState` de `hideInactiveTrips` (~líneas 228-234), ya que la visibilidad ahora es automática.

