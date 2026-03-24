

## Simplificar matching: INSERT siempre, eliminar reciclaje

### Problema actual
La constraint `UNIQUE(package_id, trip_id)` en `package_assignments` obliga a reciclar filas terminales en vez de crear nuevas. Esto agrega complejidad (query previa + lógica de reciclaje + updates individuales) y lentitud.

### Solución

#### 1) Migración SQL — Eliminar constraint UNIQUE

```sql
ALTER TABLE package_assignments 
  DROP CONSTRAINT IF EXISTS package_assignments_package_id_trip_id_key;
```

Esto permite múltiples filas `(package_id, trip_id)` — las viejas quedan como historial y las nuevas se crean limpias.

#### 2) `src/hooks/useDashboardActions.tsx` — Simplificar handleMatchPackage

Eliminar toda la lógica de reciclaje (líneas 1270-1330). Reemplazar con:

```ts
// Solo filtrar trips que ya tienen una asignación ACTIVA
const { data: activeAssignments } = await supabase
  .from('package_assignments')
  .select('trip_id')
  .eq('package_id', packageId)
  .in('trip_id', tripIdsToAssign)
  .in('status', ['bid_pending', 'bid_submitted', 'bid_won']);

const activeTripIds = new Set((activeAssignments || []).map(a => a.trip_id));
const newTripIds = tripIdsToAssign.filter(tid => !activeTripIds.has(tid));

// INSERT nuevas filas directamente (sin reciclar)
if (newTripIds.length > 0) {
  const rows = newTripIds.map(tid => ({ ... }));
  parallelOps.push(supabase.from('package_assignments').insert(rows));
}

// + update package status en paralelo (sin cambios)
```

Esto elimina ~60 líneas de lógica de reciclaje y reduce la operación a 1 query + 1 insert + 1 update en paralelo.

#### 3) `src/components/admin/AdminMatchDialog.tsx` — Ajustar query de "ya asignados"

Cambiar la query que determina qué viajeros mostrar como "Ya asignado" para filtrar solo por estados activos:

```ts
.in('status', ['bid_pending', 'bid_submitted', 'bid_won'])
```

Así los viajeros con asignaciones terminales antiguas siguen siendo seleccionables.

### Archivos
- **Migración SQL**: drop UNIQUE constraint
- **Modificar**: `src/hooks/useDashboardActions.tsx` — eliminar reciclaje
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx` — filtrar solo activos

### Resultado
- Match más rápido (no más queries + updates de reciclaje)
- Código más simple y mantenible
- Las asignaciones viejas quedan como historial natural

