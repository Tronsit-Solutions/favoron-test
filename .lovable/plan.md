

## Corregir Límite de 1000 Filas en Timeline de Actividad

### Problema
Supabase/PostgREST tiene un límite por defecto de **1000 filas** por consulta. Aunque el código usa `.limit(10000)`, esto es ignorado y solo retorna 1000 registros.

### Solución
Implementar **paginación con `.range()`** para traer todos los pedidos en lotes de 1000.

### Cambios técnicos

**Archivo:** `src/hooks/useActivityTimeline.tsx`

1. **Crear función helper de paginación**
```typescript
async function fetchAllRows<T>(
  query: any,
  batchSize: number = 1000
): Promise<T[]> {
  const allData: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData.push(...data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  return allData;
}
```

2. **Aplicar paginación a la consulta de packages**
```typescript
// Antes (solo 1000 filas)
const { data: packagesData } = await supabase
  .from('packages')
  .select(...)
  .limit(10000);

// Después (todos los registros)
const packagesData = await fetchAllPackages();
```

3. **Optimización: también aplicar a trips y accumulators** por si crecen

### Resultado esperado
- "Pedidos" mostrará el número real (no limitado a 1000)
- Stats cards mostrarán totales correctos
- Export Excel incluirá todos los registros

