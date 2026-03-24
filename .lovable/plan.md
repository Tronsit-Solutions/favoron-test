
## Fix propuesto: permitir re-asignar viajeros con historial previo del mismo pedido

### Hallazgo
No es solo un problema del “match” en sí; hay 2 bloqueos distintos:

1. **Bloqueo en UI**
   En `src/components/admin/AdminMatchDialog.tsx`, el modal marca como `✅ Ya asignado` cualquier viaje que tenga un `package_assignment` previo porque sigue usando:
   ```ts
   .not('status', 'eq', 'rejected')
   ```
   Pero ahora los statuses reales son `bid_pending`, `bid_submitted`, `bid_won`, `bid_lost`, `bid_expired`, `bid_cancelled`. Como casi nunca existe `rejected`, el modal termina bloqueando también assignments históricos/terminales.

2. **Bloqueo en persistencia**
   La tabla `package_assignments` tiene:
   ```sql
   UNIQUE(package_id, trip_id)
   ```
   Entonces aunque el modal dejara seleccionarlo, `handleMatchPackage` en `src/hooks/useDashboardActions.tsx` intenta hacer `insert` de una nueva fila. Si ese viajero ya tuvo un assignment para ese pedido, el insert puede fallar por duplicado.

### Solución simple pero correcta
No crear una fila nueva cuando ya existe historial para ese `package_id + trip_id`. En su lugar:
- si el assignment previo está en status terminal, **reciclar esa misma fila** y volverla a `bid_pending`
- si está activo, sí mantenerlo como “ya asignado” para no resetear una puja vigente por accidente

### Cambios propuestos

#### 1) `src/components/admin/AdminMatchDialog.tsx`
Cambiar la lógica de `fetchExistingAssignments` para que `alreadyAssignedTripIds` solo incluya statuses realmente activos:

```ts
.in('status', ['bid_pending', 'bid_submitted', 'bid_won'])
```

Con eso:
- `bid_lost`
- `bid_expired`
- `bid_cancelled`

ya no bloquearán la selección del viajero en el modal.

#### 2) `src/hooks/useDashboardActions.tsx`
Refactorizar `handleMatchPackage` para que, antes de insertar, consulte assignments existentes del paquete para los viajes seleccionados:

```ts
select('id, trip_id, status')
.eq('package_id', packageId)
.in('trip_id', tripIdsToAssign)
```

Luego separar en 3 grupos:

- **Activos**: `bid_pending`, `bid_submitted`, `bid_won`
  - no reinsertar
  - mantener bloqueados o ignorarlos

- **Reutilizables**: `bid_lost`, `bid_expired`, `bid_cancelled` (y legacy `rejected` si aún existiera)
  - hacer `update` sobre esa misma fila:
    - `status = 'bid_pending'`
    - `admin_assigned_tip = adminTip`
    - `traveler_address = ...`
    - `matched_trip_dates = ...`
    - `products_data = ...`
    - `quote = null`
    - `quote_expires_at = null`
    - `dismissed_by_traveler = false`
    - `updated_at = now()`
    - `expires_at = null` para que el trigger la regenere

- **Nuevos**:
  - hacer `insert` normal

Así resolvemos el problema sin tocar esquema ni migraciones.

### Por qué esta solución es la adecuada
- Respeta el historial de assignments
- Evita violar el `UNIQUE(package_id, trip_id)`
- No reabre accidentalmente bids activos
- Permite re-asignar a viajeros que antes perdieron, expiraron o fueron cancelados
- Es consistente con el flujo actual de multi-assignment

### Archivos
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx`
- **Modificar**: `src/hooks/useDashboardActions.tsx`

### Nota técnica
No propongo cambiar la base de datos porque no hace falta. El problema real es que hoy el frontend:
- bloquea demasiado en el modal
- e intenta `insert` donde debería reutilizar la fila histórica
