

## Fix: Match falla silenciosamente al re-asignar viajeros con bids expirados/perdidos

### Causa raíz

En `useDashboardActions.tsx` línea 1271-1278, la verificación de duplicados excluye solo asignaciones con status `rejected`:

```ts
.not('status', 'eq', 'rejected')
```

Pero los statuses terminales de bidding (`bid_expired`, `bid_lost`, `bid_cancelled`) **no se excluyen**. Cuando re-asignas un paquete al mismo viajero (o a cualquier viajero que ya tuvo un bid), el sistema cree que ya existe una asignación activa → no inserta nada → pero sí actualiza el paquete a `matched` → match fantasma.

### Solución — `src/hooks/useDashboardActions.tsx`

**Línea 1271-1275**: Cambiar el filtro para excluir todos los statuses terminales:

```ts
// Antes:
.not('status', 'eq', 'rejected');

// Después:
.not('status', 'in', '("rejected","bid_expired","bid_lost","bid_cancelled")');
```

Esto permite que viajeros con bids expirados/perdidos/cancelados puedan ser re-asignados al mismo paquete.

### Archivos
- **Modificar**: `src/hooks/useDashboardActions.tsx` — línea 1275

