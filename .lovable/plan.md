

## Fix: Admin status update no refleja en la card sin hard refresh

### Causa raíz

En `useDashboardState.tsx` línea 162, el admin usa `regularPackagesData.updatePackage`, que internamente hace `setPackages` sobre el estado de `regularPackagesData` — pero la vista admin lee de `adminData.packages` (un estado completamente separado). Además, línea 165: `setPackages: () => {}` — es un no-op.

Resultado: el update se graba en Supabase correctamente, pero el estado local admin nunca se actualiza. Solo se refleja cuando llega el evento de realtime (que pierde relaciones profiles/trips) o con hard refresh.

### Solución — `src/hooks/useDashboardState.tsx`

Crear un wrapper `adminUpdatePackage` que:
1. Llame a `regularPackagesData.updatePackage(id, updates)` (que hace el update en Supabase)
2. Tras éxito, actualice localmente `adminData.packages` con el merge

Cambiar línea 162 de:
```ts
updatePackage: regularPackagesData.updatePackage,
```
a:
```ts
updatePackage: async (id: string, updates: any) => {
  const result = await regularPackagesData.updatePackage(id, updates);
  // Also update admin local state, preserving relations
  adminData.setPackages(prev => prev.map(pkg => 
    pkg.id === id ? { ...pkg, ...updates, ...(result || {}) } : pkg
  ));
  return result;
},
```

Esto requiere que `useAdminData` exponga `setPackages`. Actualmente no lo hace.

### Cambios

#### 1) `src/hooks/useAdminData.tsx`
- Exponer `setPackages` en el return del hook (ya existe internamente como `useState`, solo agregar al return y al tipo `AdminData`)

#### 2) `src/hooks/useDashboardState.tsx`  
- Línea 162: reemplazar `updatePackage: regularPackagesData.updatePackage` con el wrapper que también actualiza `adminData.packages` localmente tras el update exitoso

### Archivos
- **Modificar**: `src/hooks/useAdminData.tsx` — exponer `setPackages`
- **Modificar**: `src/hooks/useDashboardState.tsx` — wrapper de `updatePackage` para admin

