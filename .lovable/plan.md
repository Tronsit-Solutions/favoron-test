

## Fix: Laggy assignment en AdminMatchDialog

### Causa raíz
Hay varios problemas de rendimiento en `AdminMatchDialog.tsx`:

1. **Reciclaje secuencial de assignments** (líneas 1300-1331 en `useDashboardActions.tsx`): Cada assignment terminal se recicla con un `await` individual. Si hay 3 assignments reciclables, son 3 queries secuenciales.

2. **`console.log` en cada render** (línea 522): `getTravelerName` hace `console.log` en cada llamada. Con 15+ viajes, son 15+ logs por render, y se dispara en cada re-render del componente.

3. **3 queries Supabase secuenciales al abrir el dialog** (líneas 389-518): Existing assignments, trip assignments map, y traveler profiles se lanzan en useEffects separados pero podrían ejecutarse en paralelo.

4. **`calculateTripPackagesTotals` filtra todo el array `packages` por cada trip card** renderizado — O(trips × packages) en cada render sin memoización.

5. **useEffect de modal state persistence** (línea 450-464): Se ejecuta en cada cambio de `adminTip`, `assignedProductsWithTips`, etc., causando re-renders innecesarios.

### Solución

#### 1) `src/hooks/useDashboardActions.tsx` — Batch recycling
Reemplazar el loop secuencial (líneas 1300-1331) con un solo `Promise.all` o mejor, un solo query batch:
```ts
// Instead of looping with await per ID:
await supabase
  .from('package_assignments')
  .update({ status: 'bid_pending', admin_assigned_tip: adminTip, ... })
  .in('id', recyclableIds);
```
Nota: esto pierde la personalización de `traveler_address` y `matched_trip_dates` por trip. Se puede resolver haciendo `Promise.all` de los updates individuales (paralelos, no secuenciales).

#### 2) `src/components/admin/AdminMatchDialog.tsx` — Quitar console.logs
- Eliminar el `console.log` en `getTravelerName` (línea 522)
- Eliminar los `console.log` en el useEffect de fetch profiles (líneas 489, 502)

#### 3) `src/components/admin/AdminMatchDialog.tsx` — Paralelizar queries iniciales
Combinar los 3 useEffects de fetch (líneas 389-518) en uno solo que lance los 3 queries con `Promise.all`.

#### 4) `src/components/admin/AdminMatchDialog.tsx` — Memoizar totales por trip
Usar `useMemo` para pre-calcular los totales de todos los trips de una vez, en lugar de recalcular por cada card.

#### 5) `src/components/admin/AdminMatchDialog.tsx` — Reducir re-renders del modal state
Debounce o eliminar el useEffect de persistencia de modal state que se dispara en cada keystroke del adminTip.

### Archivos
- **Modificar**: `src/hooks/useDashboardActions.tsx` — parallelizar recycling loop
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx` — quitar logs, paralelizar fetches, memoizar cálculos

