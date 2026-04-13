

## Plan: Eliminar columna "Precio Est." de la tabla de Cancelados

### Cambios

**Archivo**: `src/components/admin/cx/CancelledPackagesTable.tsx`

1. **Eliminar el `<TableHead>Precio Est.</TableHead>`** (linea 78)
2. **Eliminar el `<TableCell>` correspondiente** que muestra `estimated_price` (lineas 113-115)

Solo eso. El precio estimado seguira visible en el modal de detalle al hacer click en una fila.

