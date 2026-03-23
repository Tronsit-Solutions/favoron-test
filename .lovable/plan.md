

## Fix: refresh agresivo al guardar CX call

### Problema
Al guardar un CX call, `saveCXCall` llama `await fetchData()` (línea 205), que hace `setLoading(true)` → re-fetch de **todos** los paquetes completados + profiles + trips + CX calls → `setRows(result)`. Esto causa un flash completo de la tabla (loading skeletons) para actualizar una sola fila.

### Solución — actualización optimista en `src/hooks/useCustomerExperience.ts`

**1. Actualizar el estado local inmediatamente** después de confirmar el insert/update exitoso, sin llamar `fetchData()`:

```ts
// Después del insert/update exitoso:
setRows(prev => prev.map(r => 
  r.package_id === row.package_id 
    ? { ...r, ...updates, cx_id: r.cx_id || 'temp' } 
    : r
));
// Recalcular stats desde el nuevo rows
```

**2. Para inserts**, hacer `.insert(payload).select().single()` para obtener el `cx_id` real y usarlo en el estado local.

**3. Recalcular stats** inline después de la actualización optimista, sin necesidad de re-fetch.

**4. Eliminar** el `await fetchData()` de `saveCXCall`.

### Archivos
- **Modificar**: `src/hooks/useCustomerExperience.ts`

