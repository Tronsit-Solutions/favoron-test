

## Rediseñar la pestaña "Producto" del viajero: menos redundancia, texto más grande, layout más compacto

### Problemas actuales
1. **Redundancia**: El "Resumen del pedido" (línea 125-128) repite info que ya está en la tarjeta del producto (precio, cantidad)
2. **Texto muy pequeño**: Todo usa `text-xs` (12px)
3. **Layout vertical largo**: Cantidad, precio unitario, tip, empaque están apilados verticalmente

### Cambios en `src/components/dashboard/traveler/TravelerPackageDetails.tsx`

1. **Eliminar el bloque "Resumen del pedido"** (líneas 125-128): Ya que la info de productos/total se ve directamente abajo. Mantener solo Origen/Destino.

2. **Aumentar tamaño de texto**: Cambiar `text-xs` a `text-sm` en la tarjeta de producto para nombre, descripción, cantidad, precio. El título "Producto N" a `text-sm font-semibold`.

3. **Layout más compacto con grid**: Reorganizar los detalles del producto en una disposición horizontal:
   - Fila principal: Nombre del producto + precio alineado a la derecha (ya existe)
   - Fila de detalles: Cantidad y precio unitario en línea horizontal (inline con separador `·`) en vez de líneas separadas
   - Tip y link en la misma fila
   - Empaque: solo el texto corto, sin la explicación larga (quitar el `<span>` de líneas 100-104)

4. **Padding aumentado**: Cambiar `p-2` a `p-3` en las tarjetas de producto

