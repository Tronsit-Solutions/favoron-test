

## Usar package_assignments como fuente de datos del modal

### Problema actual
El modal usa dos fuentes de datos separadas:
1. **Confirmados**: Filtra del array local `packages` por `matched_trip_id` — depende de que el array global esté cargado y sincronizado
2. **En Competencia**: Query a `package_assignments` con `bid_pending`/`bid_submitted`

### Solución
Reemplazar ambas secciones con **una sola query** a `package_assignments` filtrando por `bid_pending` y `bid_won`, con joins a packages y profiles del shopper.

**Archivo: `src/components/admin/TripPackagesModal.tsx`**

1. **Eliminar** la dependencia del prop `packages` y el filtro `directPackages`
2. **Una sola query** al abrir el modal:
```tsx
const { data } = await supabase
  .from('package_assignments')
  .select(`
    id, package_id, status, admin_assigned_tip, quote,
    packages:package_id (
      id, item_description, estimated_price, purchase_origin, 
      package_destination, user_id, status, updated_at
    )
  `)
  .eq('trip_id', trip.id)
  .in('status', ['bid_pending', 'bid_won']);
```

3. **Separar visualmente** en dos grupos:
   - **Confirmados (bid_won)**: Paquetes ganados, con tabla de progreso y tips
   - **Pendientes (bid_pending)**: Paquetes en espera de respuesta del viajero

4. **Actualizar el resumen** para usar los conteos de la query en vez del array local

5. **Simplificar la interfaz** del componente eliminando el prop `packages` (ya no se necesita), actualizando los call sites en `UserTripsTab.tsx` y `MonthlyPackageDetails.tsx`

### Archivos a modificar
- `src/components/admin/TripPackagesModal.tsx` — query unificada, dos secciones por status
- `src/components/admin/UserTripsTab.tsx` — remover prop `packages` del call site
- `src/pages/MonthlyPackageDetails.tsx` — remover prop `packages` del call site

