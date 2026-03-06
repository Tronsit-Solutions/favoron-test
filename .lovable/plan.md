

## Eliminar TripSelector y mostrar todos los viajes

Cambio sencillo: quitar el componente `TripSelector` y la lógica de filtrado por `selectedTripId`, para que todos los viajes se rendericen siempre en la lista.

### Cambios en `src/components/Dashboard.tsx`

1. **Eliminar import** de `TripSelector` (línea 30)
2. **Eliminar el bloque del TripSelector** (líneas 769-776) que renderiza el dropdown condicionalmente
3. **Eliminar el filtro** `.filter(trip => !selectedTripId || trip.id === selectedTripId)` (línea 779) para que todos los viajes se muestren siempre

El estado `selectedTripId` / `setSelectedTripId` viene del hook `useDashboardState`, así que no necesita eliminarse del hook (puede quedar sin uso), pero se dejará de usar en el render.

Resultado: todos los viajes aparecen como cards apilados, cada uno con sus paquetes anidados debajo, sin dropdown selector.

