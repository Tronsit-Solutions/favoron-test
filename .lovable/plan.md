

## Fix: Paquetes fantasma por respuesta perdida

### Causa raíz confirmada

El RPC `assign_package_to_travelers` funciona correctamente. El problema es que cuando la respuesta de red se pierde:
1. El servidor SÍ procesa la asignación (status → `matched`, inserta en `package_assignments`)
2. El `withRetry` reintenta y recibe `NO_NEW_TRIPS` (porque ya se asignaron)
3. El cliente lo trata como error total → no actualiza estado local → paquete "fantasma"

### Cambios

#### 1. Tratar `NO_NEW_TRIPS` en retry como éxito (el trabajo ya se hizo)
**Archivo**: `src/hooks/useDashboardActions.tsx`

En el bloque catch del RPC (línea 1318), detectar si el error es `NO_NEW_TRIPS` y si estamos en un reintento. Si el servidor dice "ya están asignados", significa que el intento anterior SÍ funcionó. Tratarlo como éxito en lugar de error.

```typescript
// Inside withRetry callback, after catching res.error:
if (res.error?.message?.includes('NO_NEW_TRIPS')) {
  // Check if package is actually matched in DB (previous attempt succeeded)
  const { data: dbPkg } = await supabase
    .from('packages')
    .select('status')
    .eq('id', packageId)
    .single();
  if (dbPkg?.status === 'matched') {
    // Previous attempt succeeded — treat as success
    return { assigned_trip_ids: tripIdsToAssign, recovered: true };
  }
}
throw res.error;
```

#### 2. Sincronizar con DB en caso de error genérico
**Archivo**: `src/components/AdminDashboard.tsx`

En el `.catch()` (línea 293), antes de mostrar el toast de error, consultar el estado real del paquete en la DB. Si la DB dice `matched`, actualizar el estado local y tratar como éxito silencioso.

```typescript
.catch(async (error) => {
  // Check if server actually processed it despite client error
  const { data: dbPkg } = await supabase
    .from('packages')
    .select('status')
    .eq('id', matchPackageId)
    .single();
  
  if (dbPkg?.status === 'matched') {
    // Server DID process it — sync local state
    setLocalPackages(prev => prev.map(pkg => 
      pkg.id === matchPackageId ? { ...pkg, status: 'matched' } : pkg
    ));
    toast({ title: "Match exitoso", description: "El paquete fue asignado correctamente." });
    setActiveTab("matching");
    onMatchingTabChange?.("active");
    return; // Don't show error
  }
  
  // Genuine failure — show error
  toast({ title: "Error al hacer match", variant: "destructive" });
})
```

#### 3. Incluir `status === 'matched'` en filtro de activeMatches (safety net)
**Archivo**: `src/components/admin/AdminMatchingTab.tsx`

Agregar `pkg.status === 'matched'` como condición en el filtro `activeMatches` para que paquetes matched nunca queden invisibles, incluso si `assignmentsMap` aún no se cargó.

### Archivos a modificar
- `src/hooks/useDashboardActions.tsx` — recuperación en NO_NEW_TRIPS
- `src/components/AdminDashboard.tsx` — verificación de DB en .catch()
- `src/components/admin/AdminMatchingTab.tsx` — safety net en filtro activeMatches

### Resultado esperado
- Si la red falla pero el servidor procesó: el cliente se sincroniza automáticamente y muestra "Match exitoso"
- Si realmente falló: el paquete reaparece correctamente en Solicitudes
- No más paquetes fantasma en ningún escenario

