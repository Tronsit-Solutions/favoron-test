

## Incluir paquetes de package_assignments en TripPackagesModal

### Problema
Línea 24: `tripPackages` solo filtra por `pkg.matched_trip_id === trip.id`, ignorando paquetes en fase de bidding que solo existen en `package_assignments`.

### Solución — `src/components/admin/TripPackagesModal.tsx`

**1. Agregar query a `package_assignments`**
- Usar `useEffect` + `useState` para cargar assignments con `trip_id = trip.id` y `status in (bid_pending, bid_submitted)` desde Supabase
- Traer `package_id` de cada assignment

**2. Combinar ambas fuentes en `tripPackages`**
```ts
// Paquetes confirmados (matched_trip_id)
const directPackages = packages.filter(pkg => pkg.matched_trip_id === trip.id);

// Paquetes en bidding (desde assignments)
const assignmentPackageIds = assignments.map(a => a.package_id);
const biddingPackages = packages.filter(pkg => 
  assignmentPackageIds.includes(pkg.id) && pkg.matched_trip_id !== trip.id
);

const tripPackages = [...directPackages, ...biddingPackages];
```

**3. Marcar paquetes en bidding visualmente**
- Agregar un badge `⚡ Compitiendo` junto al estado para paquetes que vienen de assignments (no de `matched_trip_id`)

**4. Recalcular totales**
- Los stats (total, valor, tips) se calculan sobre el `tripPackages` combinado

### Archivos
- **Modificar**: `src/components/admin/TripPackagesModal.tsx` — agregar import de `supabase`, `useState`, `useEffect`, query de assignments, merge de paquetes

