

## Plan: Sincronización centralizada de ediciones a `package_assignments`

### Problema
Cuando se edita un paquete (productos, fecha límite, notas, etc.) desde el admin, shopper o viajero, solo se actualiza la tabla `packages`. La tabla `package_assignments` — que es lo que leen viajeros y shoppers para ver cotizaciones y detalles — no se actualiza con esos cambios.

Actualmente hay sync parcial solo para tips (`useAdminTips`) y quotes (`useQuoteManagement`), pero campos como `products_data`, `admin_assigned_tip` editados desde el modal general no se propagan.

### Solución: Sync centralizado en `updatePackage`

**Archivo: `src/hooks/usePackagesData.tsx`** — función `updatePackage`

Después de actualizar exitosamente la tabla `packages`, agregar un bloque que sincronice los campos relevantes a todas las asignaciones activas (`bid_pending`, `bid_submitted`) del mismo paquete.

Los campos compartidos entre `packages` y `package_assignments` que deben sincronizarse son:
- `products_data`
- `quote`
- `admin_assigned_tip`

Lógica:
```typescript
// Después del update exitoso a packages (línea ~140)
const syncFields: Record<string, any> = {};
if ('products_data' in updates) syncFields.products_data = updates.products_data;
if ('quote' in updates) syncFields.quote = updates.quote;
if ('admin_assigned_tip' in updates) syncFields.admin_assigned_tip = updates.admin_assigned_tip;

if (Object.keys(syncFields).length > 0) {
  syncFields.updated_at = new Date().toISOString();
  await supabase
    .from('package_assignments')
    .update(syncFields)
    .eq('package_id', id)
    .in('status', ['bid_pending', 'bid_submitted']);
}
```

### Por qué este approach
- **Un solo punto de sync**: cualquier llamada a `updatePackage` que incluya campos compartidos los propaga automáticamente.
- **No duplica lógica**: `useAdminTips` y `useQuoteManagement` ya hacen su propio sync especializado (con recálculo de service fees, logs, etc.), así que siguen funcionando independientemente.
- **Solo campos relevantes**: solo sincroniza si el update incluye campos que existen en `package_assignments`.
- **Solo asignaciones activas**: no toca asignaciones terminales (`bid_won`, `bid_lost`, `bid_expired`, `bid_cancelled`).

### Archivos a modificar
1. **`src/hooks/usePackagesData.tsx`** — agregar sync a `package_assignments` dentro de `updatePackage` (~5 líneas después del update exitoso)

