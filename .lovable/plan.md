

## Diagnóstico: Package Assignment lento

### Causa raíz

Cuando asignas un paquete a **3 viajeros**, el flujo en `handleMatchPackage` ejecuta todo **secuencialmente**:

1. ✅ Check existing assignments (1 query) — rápido
2. ✅ Insert assignments (1 query batch) — rápido  
3. ✅ Update package (1 query) — rápido
4. ❌ **Loop secuencial por cada viajero** (×3):
   - `appendTripHistoryEntry`: 2 queries (SELECT + UPDATE) por viajero = **6 queries**
   - `sendWhatsAppNotification`: 1 edge function call por viajero = **3 edge function calls**

Total: ~12 operaciones secuenciales. Cada edge function call tarda ~1-3s (Twilio). Esto produce **~5-10s de espera** antes del toast "¡Match exitoso!".

Además, `appendTripHistoryEntry` hace read-then-write (SELECT + UPDATE) en vez de un append atómico, duplicando las queries.

### Solución

**1. Paralelizar el loop de notificaciones en `useDashboardActions.tsx`**

Reemplazar el `for...of` secuencial (líneas 1334-1363) por `Promise.all` para que las 3 notificaciones + historiales se ejecuten en paralelo:

```ts
// Antes: for (const tid of tripIdsToAssign) { await append... await send... }
// Después:
await Promise.all(tripIdsToAssign.map(async (tid) => {
  appendTripHistoryEntry(tid, historyEntry); // fire-and-forget
  sendWhatsAppNotification({...});           // fire-and-forget
}));
```

**2. Hacer notificaciones fire-and-forget**

Las notificaciones WhatsApp y el history log no deben bloquear el flujo principal. Ejecutarlos sin `await` para que el toast aparezca inmediatamente después del insert + update:

```ts
// No await — run in background
for (const tid of tripIdsToAssign) {
  appendTripHistoryEntry(tid, historyEntry);
  sendWhatsAppNotification({...});
}
```

### Resultado esperado
- El match pasa de ~5-10s a ~1-2s (solo las 3 queries esenciales: check, insert, update)
- Notificaciones WhatsApp e historial se procesan en background sin bloquear la UI

### Archivos
- **Modificar**: `src/hooks/useDashboardActions.tsx` — hacer fire-and-forget el loop de líneas 1334-1363

Un cambio en ~10 líneas de un solo archivo.

