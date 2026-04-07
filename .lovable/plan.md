

## Agregar modal de detalle al hacer click en filas de Cancelados

### Cambios

**1. `src/components/admin/cx/CancelledPackagesTable.tsx`**
- Agregar estado local `selectedRow` y `modalOpen`
- Hacer cada `TableRow` clickeable con `cursor-pointer` y `hover:bg-muted/50`
- Al hacer click, setear `selectedRow` con la fila y abrir el modal
- Renderizar un `Dialog` con la info del pedido: shopper, producto(s), status, razón de cancelación, viajero, precio, origen, destino, deadline, fechas, notas

**2. Modal inline en el mismo componente** (no reusar `CXPackageDetailModal` porque ese espera `CXPackageRow` con campos diferentes como `completed_at`, `counterpart_name`, `label_number`)
- Mostrar: nombre del shopper y teléfono, productos (usando `PackageProductDisplay`), status badge, razón de cancelación/expiración, viajero asignado, precio estimado, origen y destino, deadline, fechas de creación y actualización
- Usar el mismo estilo visual que `CXPackageDetailModal`

### Detalle
- No se necesitan cambios en el hook ni en la página
- Solo se modifica `CancelledPackagesTable.tsx` agregando estado + modal

