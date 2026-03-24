

## Limpieza de console.logs de debug en AvailableTripsCard

### Cambio
En `src/components/AvailableTripsCard.tsx`, eliminar:
- **Líneas 24-32**: `console.log('📅 This week filter', ...)` dentro del `.filter()` — se ejecuta por cada viaje en cada render (40+ veces)
- **Líneas 37-42**: `console.log('📊 Trip counts', ...)` — resumen que ya no es necesario

### Archivo
- **Modificar**: `src/components/AvailableTripsCard.tsx` — eliminar ambos console.log

