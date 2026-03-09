

## Filtrar solo paquetes completados en detalles del historial de viajes

### Cambio
En `src/components/profile/TripHistory.tsx`, la función `getTripPackages` actualmente retorna todos los paquetes asociados al viaje sin filtrar por estado. Se debe agregar un filtro para mostrar solo paquetes con status `completed` (o `completed_paid`/`delivered_to_office` si aplica).

### Archivo: `src/components/profile/TripHistory.tsx`

**1. Función `getTripPackages` (~línea 21):** Agregar filtro de estado completado:
```tsx
const getTripPackages = (tripId: string) => {
  return packages.filter(pkg => 
    pkg.matched_trip_id === tripId && 
    ['completed', 'completed_paid', 'delivered_to_office'].includes(pkg.status)
  );
};
```

Esto afectará automáticamente las métricas (conteo de paquetes, total de tips) y la lista de paquetes en los detalles, ya que todas usan `getTripPackages`.

