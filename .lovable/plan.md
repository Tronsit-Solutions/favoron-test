

## Fix: Total Shoppers truncado a 1000 por límite de Supabase

### Problema
En `src/hooks/useCACAnalytics.tsx` línea 150-154, la query `supabase.from('profiles').select(...).limit(10000)` retorna máximo 1000 filas por el límite servidor `PGRST_MAX_ROWS`. Todos los cálculos de "totalShoppers" se basan en contar esos resultados truncados.

### Solución
Agregar una query separada con `count: 'exact', head: true` para obtener el conteo real de perfiles, y usar ese valor como `totalShoppers` en los KPIs. El resto de cálculos (activeShoppers, monetizedShoppers) dependen de cruzar con packages/trips, que también pueden estar truncados, pero esos ya usan `.limit(20000)` y tienen menos registros. El problema principal visible es el denominador "/ 1000".

### Cambios

**`src/hooks/useCACAnalytics.tsx`**
- Agregar una query nueva con `head: true` para obtener el conteo exacto de perfiles:
  ```ts
  const { data: exactUserCount } = useQuery({
    queryKey: ['cac-exact-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
  ```
- En el `useMemo`, cambiar `totalShoppers: totals.totalUsers` (línea 519) por `totalShoppers: exactUserCount ?? totals.totalUsers`
- Agregar `exactUserCount` a las dependencias del `useMemo`
- Actualizar los cálculos de tasas que usan `totals.totalUsers` como denominador para usar el conteo exacto cuando esté disponible (shopperConversionRate, shopperActivationRate)

### Resultado
"Shoppers Activos" mostrará el número real (ej: "463 / 1247") en vez del truncado "463 / 1000".

