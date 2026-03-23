

## Fix: valor de productos asignados a viajeros no incluye multi-assignments

### Causa raíz
`calculateTripPackagesTotals` (línea 100-119) filtra paquetes solo por `pkg.matched_trip_id === tripId`. Con el nuevo flujo multi-assignment, los paquetes en fase de bidding (`bid_pending`, `bid_submitted`) tienen `matched_trip_id = null` — solo existen como filas en `package_assignments`. Por eso esos paquetes no aparecen en el conteo.

### Solución

**Modificar `src/components/admin/AdminMatchDialog.tsx`**:

1. **Cargar assignments por trip** — Al abrir el dialog, hacer un query de `package_assignments` agrupado por `trip_id` para todos los trips disponibles, trayendo también el `package_id` y `status` del assignment
2. **Ampliar `calculateTripPackagesTotals`** — Además de buscar por `matched_trip_id`, incluir paquetes que tengan un assignment activo (`bid_pending`, `bid_submitted`) apuntando a ese trip. Estos se contarían como "Pendiente"
3. **Evitar duplicados** — Si un paquete ya tiene `matched_trip_id = tripId` (ganador), no contarlo también desde assignments

### Detalle técnico
```text
Antes:
  tripPackages = packages.filter(pkg => pkg.matched_trip_id === tripId)
  // Misses packages with matched_trip_id = null but active assignment

Después:
  // Direct matches (winner)
  directPackages = packages.filter(pkg => pkg.matched_trip_id === tripId)
  
  // Assignment-based (bidding phase)
  assignmentPackageIds = tripAssignments[tripId] // from preloaded data
  assignmentPackages = packages.filter(pkg => 
    assignmentPackageIds.includes(pkg.id) && pkg.matched_trip_id !== tripId
  )
  
  // Combine, assignment packages always count as "pending"
```

### Implementación
- Agregar un `useEffect` o query que cargue `package_assignments` con `status in (bid_pending, bid_submitted)` agrupados por `trip_id`, guardando en un estado `tripAssignmentsMap: Record<string, string[]>` (trip_id → package_ids)
- Modificar `calculateTripPackagesTotals` para consultar ese mapa además del filtro existente
- Un solo archivo: `src/components/admin/AdminMatchDialog.tsx`

