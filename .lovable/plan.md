

## Agregar botón "Eliminar Producto" en modo edición del admin

### Problema
Cuando un paquete tiene muchos productos, el admin no puede eliminar productos individuales. Solo existe la opción de "Cancelar" (que marca como cancelado con reembolso), pero no de eliminar completamente un producto del pedido.

### Solución
Agregar un botón de eliminar en cada producto dentro del **modo edición** (`editMode`) del `PackageDetailModal`, con protección para no eliminar el último producto restante.

### Cambios en `src/components/admin/PackageDetailModal.tsx`

1. **Nueva función `handleRemoveProduct(index)`**: Elimina el producto del array `editProducts` usando `filter`. Solo permite eliminar si hay más de 1 producto.

2. **Botón "Eliminar" en cada card de producto** (edit mode, línea ~1828): Junto al badge "Producto #N" y el campo de tip, agregar un botón rojo con icono de basura/X que llame a `handleRemoveProduct(idx)`. Deshabilitado si solo queda 1 producto.

3. **Confirmación**: Un `window.confirm()` simple antes de eliminar, dado que el cambio no se persiste hasta que el admin presione "Guardar".

4. **`handleSaveChanges` ya funciona correctamente**: Toma `editProducts` tal como está y lo guarda como `products_data`, así que al eliminar un producto del array local se persiste automáticamente al guardar.

### Detalle de UI

En la card de cada producto en edit mode (línea ~1828-1829), agregar al lado del badge:

```
[Producto #1] [Tip: Q___]  [🗑 Eliminar]  ← solo si hay >1 producto
```

El botón será `variant="ghost"` con `text-destructive`, similar al botón de cancelar existente.

### Archivo a modificar
- `src/components/admin/PackageDetailModal.tsx` (1 función nueva + 1 botón en UI)

