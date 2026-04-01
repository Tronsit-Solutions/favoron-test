

## Fix: Sincronizar quote a package_assignments al editar tips/cotización

### Problema
Cuando un admin edita el tip o la cotización de un paquete con asignaciones activas (`bid_submitted`), el campo `quote` en `package_assignments` no se actualiza. El viajero (y el shopper) siguen viendo los valores anteriores.

**Dos hooks afectados:**

### Cambios

**1. `src/hooks/useAdminTips.tsx`** (línea ~128)
- Agregar `quote: updatedQuote` al update de `package_assignments` que ya existe (solo falta ese campo).

```typescript
// Línea 128-131: agregar quote
.update({
  products_data: normalizedProducts,
  admin_assigned_tip: totalTip,
  quote: updatedQuote,        // ← AGREGAR
  updated_at: new Date().toISOString(),
})
```

**2. `src/hooks/useQuoteManagement.tsx`** (después de línea 164)
- Agregar un nuevo bloque que sincronice `quote`, `admin_assigned_tip` y `products_data` a todas las asignaciones activas del paquete.

```typescript
// Después del update a packages (línea 164)
await supabase
  .from('package_assignments')
  .update({
    quote: updatedQuote,
    admin_assigned_tip: newTip,
    products_data: updatedProductsData,
    updated_at: new Date().toISOString(),
  })
  .eq('package_id', packageId)
  .in('status', ['bid_pending', 'bid_submitted']);
```

### Impacto
- El viajero verá el tip actualizado en su modal "Tip Asignado" inmediatamente (via realtime en `package_assignments`).
- El shopper verá los valores actualizados en su selector de cotizaciones.
- No se requieren migraciones ni cambios de schema.

