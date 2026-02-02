
# Plan: Mantener Paquetes con Incidencia Visibles en Dashboard del Viajero

## Problema

Actualmente, cuando un viaje pasa a estado `completed_paid`, **todos** los paquetes de ese viaje se ocultan del dashboard del viajero (líneas 869-873 de `Dashboard.tsx`). Esto significa que si un paquete tiene `incident_flag: true`, desaparecerá de la vista del viajero una vez que cobre por los otros paquetes.

## Solución

Modificar el filtro para que los paquetes con `incident_flag: true` permanezcan visibles aunque su viaje esté `completed_paid`.

## Cambio Técnico

### Archivo: `src/components/Dashboard.tsx`

**Antes (líneas 869-873):**
```typescript
// Exclude packages from completed and paid trips
const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
if (matchedTrip && matchedTrip.status === 'completed_paid') {
  return false;
}
```

**Después:**
```typescript
// Exclude packages from completed and paid trips, EXCEPT those with incidents
const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
if (matchedTrip && matchedTrip.status === 'completed_paid') {
  // Keep incident packages visible for tracking/resolution
  if (!pkg.incident_flag) {
    return false;
  }
}
```

## Resultado Esperado

| Situación | Visible en Dashboard? |
|-----------|----------------------|
| Paquete normal, viaje activo | ✅ Sí |
| Paquete normal, viaje `completed_paid` | ❌ No |
| Paquete con incidencia, viaje activo | ✅ Sí |
| Paquete con incidencia, viaje `completed_paid` | ✅ **Sí** (nuevo) |

## Flujo del Viajero

```text
1. Viajero tiene 7 paquetes, 1 con incidencia
2. Cobra por los 6 paquetes sin incidencia
3. Viaje pasa a completed_paid
4. Los 6 paquetes normales desaparecen del dashboard
5. El paquete con incidencia PERMANECE visible
6. Admin resuelve incidencia → quita flag → paquete desaparece
```
