
# Fix: Aumentar límite de registros en Activity Timeline

## Problema
Supabase tiene un límite por defecto de 1000 registros por query. El Timeline muestra 1000 solicitudes cuando en realidad hay 1245.

## Solución
Modificar el hook `useActivityTimeline.tsx` para implementar paginación o aumentar el límite explícitamente.

## Opciones de implementación

### Opción A: Aumentar el límite (Simple)
Agregar `.limit(10000)` a las queries para traer todos los registros de una vez.

```typescript
// Línea 110-117
const { data: packagesData, error: packagesError } = await supabase
  .from('packages')
  .select(`...`)
  .not('status', 'eq', 'pending_approval')
  .order('created_at', { ascending: false })
  .limit(10000);  // Aumentar límite
```

### Opción B: Paginación (Más robusto)
Implementar fetching recursivo que traiga todos los registros en bloques de 1000.

```typescript
async function fetchAllPackages() {
  let allPackages: PackageData[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('packages')
      .select(`...`)
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allPackages = [...allPackages, ...data];
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  
  return allPackages;
}
```

## Recomendación
**Opción A** es suficiente para el volumen actual (1245 packages). Si el sistema crece mucho (>10,000), se debería implementar la Opción B con paginación.

## Cambios en archivo

**`src/hooks/useActivityTimeline.tsx`**
- Línea 99-105: Agregar `.limit(10000)` a query de trips
- Línea 110-117: Agregar `.limit(10000)` a query de packages

## Resultado esperado
- Stats mostrará: **239 Viajes** | **1245 Solicitudes** | **1484 Resultados filtrados**
