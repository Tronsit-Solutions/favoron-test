

## Fix: Cambios de admin en viajes no se reflejan para el viajero sin hard refresh

### Causa raíz

El hook `useOptimizedTripsData` (que usa el viajero) cachea los datos de viajes con un TTL de 30 segundos y no tiene suscripción en tiempo real a cambios en la tabla `trips`. Cuando el admin edita un viaje desde `AdminDashboard`, solo se llama `refreshAdminData()` que actualiza la vista del admin. El viajero no recibe ninguna señal de que sus datos cambiaron.

### Solución

Agregar una suscripción de Supabase Realtime en `useOptimizedTripsData` que escuche cambios (`UPDATE`) en la tabla `trips` filtrados por el `user_id` del viajero. Cuando se detecte un cambio, invalidar el cache y refrescar los datos automáticamente.

### Cambios

**Archivo: `src/hooks/useOptimizedTripsData.tsx`**

Agregar un `useEffect` con suscripción Realtime:

```typescript
useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel(`trips-realtime-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trips',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      console.log('✈️ Realtime trip update received:', payload.eventType);
      refreshCache();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId, refreshCache]);
```

Esto es todo lo que se necesita. Cuando el admin guarda cambios en un viaje, Supabase emite el evento, el hook del viajero lo recibe, refresca el cache, y los datos se actualizan sin necesidad de reload.

### Resultado esperado
- Admin edita viaje → viajero ve los cambios en ~1-2 segundos sin refresh
- Sin impacto en performance (un solo canal por usuario)
- Compatible con el sistema de cache existente

