

## Plan: Simplificar completamente el flujo de match

### Problema
Aunque el RPC `assign_package_to_travelers` es rápido (~100ms), el flujo completo tarda ~30s por capas de protección innecesarias en el cliente:
- `matchingPackageIds` Set con tracking visual
- `recentMatchRef` con protección anti-stale de 3.5s
- Snapshot/pending sync con `processQueuedUpdates` y delays de 200ms
- Navegación automática a tab "matches" con `requestAnimationFrame`
- La sincronización `useEffect` en AdminDashboard tiene 6 dependencias y múltiples branches que disparan re-renders en cascada

### Cambios

**1. `src/components/AdminDashboard.tsx` — Simplificar `handleMatch`**

Reducir a lo esencial:
```
const handleMatch = async (adminTip, productsWithTips, selectedTripIds) => {
  // Validar
  // Cerrar modal inmediatamente
  setSelectedPackage(null);
  setShowMatchDialog(false);
  
  // Llamar al RPC (ya simplificado en useDashboardActions)
  await onMatchPackage(matchPackageId, tripIds[0], adminTip, productsWithTips, tripIds);
  
  // Actualizar estado local optimista
  setLocalPackages(prev => prev.map(pkg => 
    pkg.id === matchPackageId ? { ...pkg, status: 'matched' } : pkg
  ));
  
  // Toast de éxito
  toast({ title: "¡Match exitoso!", description: "..." });
};
```

Eliminar:
- `matchingPackageIds` state y su tracking (ya no se necesita)
- `recentMatchRef` y su protección de 3.5s
- `requestAnimationFrame` + navegación a tab "matches" (el usuario quiere quedarse en pendiente)

**2. `src/components/AdminDashboard.tsx` — Simplificar sync `useEffect`**

Reemplazar el bloque complejo de sincronización (líneas 136-215) por uno directo:
```
useEffect(() => {
  if (!hasOpenModals() && !showMatchDialog) {
    setLocalPackages(packages);
    setLocalTrips(trips);
  }
}, [packages, trips]);
```

Eliminar: snapshot pending, `pendingSnapshotRef`, `modalStateRef`, `processQueuedUpdates` setTimeout, protección por `recentMatchRef`.

**3. `src/components/admin/AdminMatchDialog.tsx` — Simplificar `handleMatch`**

Mantener solo lo esencial:
```
const handleMatch = async () => {
  if (selectedTripIds.size === 0 || isSubmittingMatch) return;
  setIsSubmittingMatch(true);
  try {
    const tipAmount = getTotalAssignedTip();
    const tripIdsArray = Array.from(selectedTripIds);
    await onMatch(tipAmount, isMultiProductOrder() ? assignedProductsWithTips : undefined, tripIdsArray);
  } catch (err) {
    console.error('[MATCH] error:', err);
  } finally {
    setIsSubmittingMatch(false);
  }
};
```

Eliminar: cache invalidation de `travelerDataCacheRef`, logs excesivos.

**4. `src/hooks/useDashboardActions.tsx` — Ya está simplificado**

El código actual (líneas 1245-1378) ya es directo: prepara datos → llama RPC → side effects en setTimeout(0). No necesita cambios adicionales.

**5. Eliminar prop `matchingPackageIds`**

Remover de `AdminDashboard` → `AdminMatchingTab` → `PendingRequestsTab` ya que no se necesita el tracking visual de "en progreso".

### Archivos a modificar
- `src/components/AdminDashboard.tsx` — Simplificar handleMatch y sync useEffect
- `src/components/admin/AdminMatchDialog.tsx` — Simplificar handleMatch

### Resultado esperado
- Match completo en <1s (RPC directo)
- Sin re-renders en cascada por sync protection
- El usuario se queda en la pestaña actual después del match
- Side effects (WhatsApp, email) siguen corriendo en background sin afectar la UX

