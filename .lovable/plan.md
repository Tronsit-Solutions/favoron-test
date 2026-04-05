

## Plan: Simplificar el flujo de matching

### Problema actual
El flujo de matching tiene demasiadas capas defensivas que lo hacen lento y frágil:
- Timeout de 5s con `Promise.race`
- Recovery path con polling cada 600ms durante 4s
- Verificación post-match con `setTimeout` a 1s
- Verificación UI a 2s
- Side effects diferidos a 300ms con WhatsApp, email, history logs
- Logging extensivo con traceIds

El RPC `assign_package_to_travelers` en sí es simple y rápido (INSERT + UPDATE). Todo lo demás es overhead del cliente.

### Cambios

**1. `src/hooks/useDashboardActions.tsx` — Simplificar `handleMatchPackage`**

Reemplazar todo el bloque de ~200 líneas por un flujo directo:
- Preparar `updatedProductsData` (mantener, es necesario)
- Llamar `supabase.rpc('assign_package_to_travelers', ...)` directamente sin timeout ni Promise.race
- Si hay error, mostrar toast y throw
- Si OK, disparar side effects (WhatsApp/email/history) en un `setTimeout(..., 0)` sin bloquear
- Eliminar: `verifyPackageMatched`, `waitForMatchConfirmation`, el recovery path completo, el DB VERIFY setTimeout

**2. `src/components/AdminDashboard.tsx` — Simplificar `handleMatch`**

- Mantener: cerrar modal, llamar `onMatchPackage`, actualizar `localPackages` en `.then()`
- Eliminar: el `setTimeout` de UI VERIFY a 2s, los logs excesivos de timing
- Mantener toast de éxito y navegación a matches tab

### Resultado esperado
- El match se completa en <1s (es un INSERT + UPDATE en Postgres)
- Si falla, se muestra un toast inmediato con el error real
- Side effects (WhatsApp, email) se disparan sin bloquear la respuesta
- Código reducido de ~200 líneas a ~60

