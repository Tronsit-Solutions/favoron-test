

## Fix: Match lento — 4 queries secuenciales bloqueantes

### Causa raíz

En `handleMatchPackage` (líneas 1271-1379), hay **4 operaciones de DB secuenciales** donde solo la primera es realmente bloqueante:

1. `await` query existing assignments (línea 1271) — **necesario** antes de decidir recycle vs insert
2. `await Promise.all(recyclePromises)` (línea 1331) — reciclar assignments
3. `await supabase.insert(assignmentRows)` (línea 1359) — insertar nuevos assignments
4. `await updatePackage(packageId, updateData)` (línea 1379) — actualizar status del paquete

**Los pasos 2, 3 y 4 son independientes entre sí** pero se ejecutan uno tras otro. Además, `updatePackage` pasa por el hook que hace `.select().maybeSingle()` innecesariamente (ya sabemos qué datos enviamos).

### Solución

**Archivo: `src/hooks/useDashboardActions.tsx`**

1. **Paralelizar pasos 2, 3 y 4**: Después de obtener existing assignments (paso 1), lanzar recycle, insert y updatePackage **en paralelo** con `Promise.all`.

2. **Usar supabase directo para el update del paquete**: En lugar de `await updatePackage(packageId, updateData)` que pasa por el hook (con `.select().maybeSingle()` extra), hacer un `supabase.from('packages').update(updateData).eq('id', id)` directo sin `.select()`. El realtime subscription ya se encarga de actualizar el estado local.

```ts
// DESPUÉS del paso 1 (query existing assignments):
const parallelOps: Promise<any>[] = [];

// Paso 2: Recycle (si hay)
if (recyclableIds.length > 0) {
  parallelOps.push(Promise.all(recyclePromises));
}

// Paso 3: Insert (si hay)
if (newTripIds.length > 0) {
  parallelOps.push(supabase.from('package_assignments').insert(assignmentRows));
}

// Paso 4: Update package status — directo sin .select()
parallelOps.push(
  supabase.from('packages').update(updateData).eq('id', packageId)
);

await Promise.all(parallelOps);
```

### Resultado esperado
- El match pasa de ~4 queries secuenciales (~2-4s) a 1 query + 1 batch paralelo (~1s)
- La UI muestra "Match exitoso" casi inmediatamente después de cerrar el dialog

