

## Mostrar paquetes bid_pending en "Paquetes en este Viaje" del AdminMatchDialog

### Problema
En `AdminMatchDialog.tsx` (línea 586-595), la query de paquetes del viajero solo busca por `.eq('matched_trip_id', trip.id)`. Los paquetes en fase de bidding (`bid_pending`) tienen `matched_trip_id = null` — solo están vinculados al viaje a través de `package_assignments`. Por eso no aparecen.

### Solución — `src/components/admin/AdminMatchDialog.tsx`

Dentro del bloque `packagesPromise` (líneas 575-614):

1. **Agregar query paralela a `package_assignments`** para obtener los `package_id` con `trip_id = trip.id` y status `bid_pending` o `bid_submitted`
2. **Fetch de esos paquetes adicionales** por sus IDs
3. **Combinar ambas fuentes** eliminando duplicados
4. **Marcar los paquetes de bidding** para mostrarlos con badge "⚡ Bid Pending" o "⚡ Bid Submitted"

```ts
// 1. Query existente (matched_trip_id)
const { data: directPkgs } = await supabase
  .from('packages')
  .select('*, profiles!packages_user_id_fkey(...)')
  .eq('matched_trip_id', trip.id)
  .in('status', [...TIMER_STATUSES, ...PAID_OR_POST_PAYMENT]);

// 2. Query nueva (package_assignments)
const { data: assignments } = await supabase
  .from('package_assignments')
  .select('package_id, status')
  .eq('trip_id', trip.id)
  .in('status', ['bid_pending', 'bid_submitted']);

// 3. Fetch paquetes de assignments que no estén ya en directPkgs
const directIds = new Set((directPkgs || []).map(p => p.id));
const assignmentPkgIds = (assignments || [])
  .map(a => a.package_id)
  .filter(id => !directIds.has(id));

let biddingPkgs = [];
if (assignmentPkgIds.length > 0) {
  const { data } = await supabase
    .from('packages')
    .select('*, profiles!packages_user_id_fkey(...)')
    .in('id', assignmentPkgIds);
  biddingPkgs = (data || []).map(p => ({ ...p, _isBidding: true }));
}

// 4. Combinar — sin filtrar por timer los de bidding
const allPkgs = [...filtered, ...biddingPkgs];
setTravelerPackages(allPkgs);
```

5. **En el render** (línea 1930), mostrar badge visual para paquetes de bidding:
```tsx
{pkg._isBidding && (
  <Badge variant="warning">⚡ Compitiendo</Badge>
)}
```

### Archivos
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx` — bloque `packagesPromise` y render de paquetes

