

## Plan: Revertir el flujo de match a `supabase.rpc()` directo

### Problema encontrado

La version desplegada (publicada) usa un flujo simple y directo:

```text
supabase.rpc('assign_package_to_travelers', params)  →  done
```

La version actual (preview) agrega 3 pasos extra antes del RPC:

```text
await supabase.auth.getSession()          ← round-trip de red (1-3s si hay token refresh)
supabase.from('client_errors').insert()   ← escritura a DB
fetch() + AbortController + retry loop   ← overhead adicional
```

El `getSession()` es el cuello de botella principal: puede disparar un refresh de token JWT que toma 1-3 segundos adicionales. Todo esto fue introducido entre commits `31787bf5` (simple) y `44b3cd24` (fetch con timeout).

### Solucion

Revertir `handleMatchPackage` al flujo directo de `supabase.rpc()`, conservando solo las mejoras utiles:

1. **Eliminar `await supabase.auth.getSession()`** -- `supabase.rpc()` ya maneja auth internamente
2. **Eliminar el `fetch()` manual** con AbortController y retry loop -- era para manejar timeouts, pero con los triggers optimizados ya no es necesario
3. **Conservar el logging a `client_errors`** pero hacerlo fire-and-forget (ya lo es) y moverlo despues del RPC como registro de exito/fallo
4. **Mantener `RPC_TIMEOUT_MS`** como safety net pero usar el AbortSignal nativo de supabase-js si es necesario, o simplemente confiar en el timeout default de PostgREST

### Cambio concreto

En `src/hooks/useDashboardActions.tsx`, reemplazar lineas ~1301-1441 (todo el bloque de fetch/retry) con:

```typescript
const matchStartTime = performance.now();
console.log(`[MATCH] START packageId=${packageId} trips=${tripIdsToAssign.join(',')} tip=${adminTip}`);

const { data: rpcResult, error: rpcError } = await supabase.rpc('assign_package_to_travelers', {
  _package_id: packageId,
  _trip_ids: tripIdsToAssign,
  _admin_tip: adminTip,
  _products_data: updatedProductsData || null
});

const totalElapsed = Math.round(performance.now() - matchStartTime);
console.log(`[MATCH] Elapsed: ${totalElapsed}ms, success=${!rpcError}`);

if (rpcError) {
  // Log error (fire-and-forget)
  supabase.from('client_errors').insert({
    message: `Match RPC failed: ${rpcError.message}`,
    type: 'match_error', severity: 'error',
    route: '/dashboard?tab=admin',
    context: { packageId, tripIds: tripIdsToAssign, adminTip, totalElapsedMs: totalElapsed }
  }).then(() => {}, () => {});

  const errorMsg = rpcError.message?.includes('NO_NEW_TRIPS')
    ? "Todos los viajeros seleccionados ya tienen asignaciones activas."
    : rpcError.message?.includes('Failed to fetch') || rpcError.message?.includes('Load failed')
      ? "Error de conexion. Verifica tu internet e intentalo de nuevo."
      : `Error: ${rpcError.message || 'No se pudo realizar el match.'}`;
  toast({ title: "Error al confirmar match", description: errorMsg, variant: "destructive", duration: 10000 });
  throw rpcError;
}

console.log('[MATCH] RPC OK, result:', rpcResult);
```

### Archivo a modificar

- `src/hooks/useDashboardActions.tsx` -- lineas ~1301-1498: reemplazar bloque fetch/retry con `supabase.rpc()` directo

### Impacto

- Elimina 1-3 segundos de latencia por `getSession()`
- Elimina overhead de AbortController, retry loop, y parsing manual de JSON
- Conserva observabilidad (logging de errores, timing en console)
- Mismo comportamiento funcional que la version desplegada que el usuario confirma que es rapida

