

## Mostrar timer de bid_pending en viajeros asignados

### Problema
La query de `package_assignments` en `PackageDetailModal.tsx` (línea 378) no incluye los campos `expires_at` ni `quote_expires_at` en el SELECT. El componente `AssignmentCountdown` ya existe y funciona (línea 1428-1430), pero nunca se renderiza porque `assignment.expires_at` siempre es `undefined`.

### Solución — `src/components/admin/PackageDetailModal.tsx`

**Línea 378**: Agregar `expires_at` y `quote_expires_at` al SELECT de la query:

```ts
// Antes:
.select('id, package_id, trip_id, status, quote, admin_assigned_tip, traveler_address, matched_trip_dates, products_data, created_at')

// Después:
.select('id, package_id, trip_id, status, quote, admin_assigned_tip, traveler_address, matched_trip_dates, products_data, created_at, expires_at, quote_expires_at')
```

No se necesitan cambios adicionales — los componentes `AssignmentCountdown` y `QuoteExpirationCountdown` ya están condicionados correctamente en líneas 1428-1434.

### Archivos
- **Modificar**: `src/components/admin/PackageDetailModal.tsx` — línea 378

