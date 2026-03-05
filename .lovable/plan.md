

## Mostrar viajero anterior cuando la cotización fue rechazada

### Problema
Cuando un shopper rechaza la cotización, el `matched_trip_id` se limpia a `null`. La sección "Información del Viajero" (línea 1105) solo se muestra si `matchedTrip` existe, así que desaparece completamente. La info del viajero rechazado ya se guarda en `quote_rejection.rejected_traveler` y se muestra dentro del banner de rechazo, pero de forma sutil y parcial.

### Solución

**Modificar `PackageDetailModal.tsx`**:

1. Cuando `matchedTrip` es `null` pero existe `quote_rejection.rejected_traveler` o `traveler_rejection.previous_traveler_id`, mostrar una sección "Último Viajero Asignado" con los datos disponibles del viajero anterior.

2. La sección usará los datos ya almacenados en `quote_rejection.rejected_traveler` (nombre, ruta, fechas) y si tiene `traveler_id`, hará un query al perfil para obtener email/teléfono.

3. Se mostrará con un estilo diferenciado (borde amarillo/gris) indicando que es el viajero del intento anterior, no uno activo.

**Cambio concreto**: Después del bloque `{matchedTrip && (...)}` (línea 1105), agregar un bloque `{!matchedTrip && lastKnownTraveler && (...)}` que muestre la Card con título "Último Viajero Asignado" y un badge "Desasignado" para que el admin siempre pueda ver quién fue el viajero.

### Archivos a modificar
- `src/components/admin/PackageDetailModal.tsx` — Agregar sección de "Último Viajero Asignado" cuando no hay viaje activo pero hay historial

