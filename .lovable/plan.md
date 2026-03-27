

## Fix: Excluir asignaciones expiradas del GMV pendiente en el Match Dialog

### Problema
Cuando asignas un paquete a un viajero, el valor "Pendiente" (GMV pendiente) que aparece junto a cada viaje incluye paquetes cuyas asignaciones ya expiraron. Esto infla el valor mostrado.

**Causa**: En `AdminMatchDialog.tsx`, el cálculo de `tripTotalsMap` (línea 103-151) suma paquetes con status `matched` o `quote_sent` que aún tienen `matched_trip_id` apuntando al viaje, aunque su asignación ya expiró (`bid_expired`). Los paquetes se indexan por `matched_trip_id` sin verificar si la asignación sigue activa.

### Solución

**Archivo**: `src/components/admin/AdminMatchDialog.tsx`

1. **Ampliar la query de `tripAssignmentsMap`** (línea 450): Agregar `bid_won` al filtro de status para que también capture asignaciones ganadas, y cambiar la estructura para incluir el `status` de la asignación.

2. **Filtrar paquetes directos contra asignaciones activas**: En el loop de `tripTotalsMap` (líneas 130-137), para paquetes en status `matched` o `quote_sent`, verificar que exista una asignación activa (no expirada) para ese trip. Si la asignación está expirada, no sumar al `pendingTotal`.

**Cambio concreto en el cálculo** (líneas 130-137):
```typescript
for (const pkg of directPackages) {
  const value = calculatePackageValue(pkg);
  if (pendingStatuses.includes(pkg.status)) {
    // Check if there's an active assignment for this trip
    const hasActiveAssignment = activeAssignmentsByTrip[tripId]?.has(pkg.id);
    if (hasActiveAssignment) pendingTotal += value;
  } else if (confirmedStatuses.includes(pkg.status)) {
    confirmedTotal += value;
  }
}
```

3. **Construir mapa de asignaciones activas**: Modificar la query existente (línea 445-452) para devolver también el `package_id` y `status`, y construir un set de package IDs con asignaciones activas por trip. Solo contar `bid_pending`, `bid_submitted`, `bid_won` como activas.

