

## Fix: "Procesando match..." se queda colgado

### Causa raíz
En `useDashboardActions.tsx` (líneas 1390-1419), después de completar el match exitosamente, hay un `for` loop **secuencial** que por cada viajero:
1. Hace `appendTripHistoryEntry()` — lee y escribe en la DB (2 queries)
2. Llama `sendWhatsAppNotification()` — invoca un edge function

Para 2 viajeros = 4+ llamadas de red secuenciales. Todo esto ocurre **dentro** del `await` de `AdminDashboard.tsx` línea 257, así que el toast de "Procesando match..." no se reemplaza hasta que TODO termina.

### Solución

**Archivo: `src/hooks/useDashboardActions.tsx`**

Hacer las operaciones post-match (history log + WhatsApp) **fire-and-forget**: no esperarlas. El match ya se completó exitosamente en la DB, así que estas son operaciones auxiliares que no deben bloquear la UI.

```ts
// Líneas 1390-1419: Cambiar de for-loop secuencial a fire-and-forget paralelo
// ANTES:
for (const tid of tripIdsToAssign) {
  appendTripHistoryEntry(tid, historyEntry);  // await implícito
  sendWhatsAppNotification({...});
}

// DESPUÉS:
Promise.all(tripIdsToAssign.map(tid => {
  const historyEntry = createHistoryEntry(...);
  appendTripHistoryEntry(tid, historyEntry);
  const matchedTrip = trips.find(trip => trip.id === tid);
  if (matchedTrip?.user_id) {
    sendWhatsAppNotification({...});
  }
})).catch(err => console.error('Post-match side effects error:', err));
// No await — fire and forget
```

Esto hace que el match se resuelva inmediatamente después de actualizar el paquete (línea 1379), y las notificaciones corren en background.

### Resultado
- El toast "Procesando match..." desaparece casi instantáneamente
- Las notificaciones y logs se envían en paralelo sin bloquear la UI

