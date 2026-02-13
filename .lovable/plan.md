

## Excluir productos cancelados de las etiquetas

### Problema
El componente `PackageLabel` (`src/components/admin/PackageLabel.tsx`) no filtra productos con `cancelled: true` en `products_data`. Esto causa:
1. Productos cancelados aparecen listados en la etiqueta (ej: "3. Makeup Amarillo")
2. La cantidad total incluye productos cancelados (muestra 5 en vez de 4)
3. El precio total incluye productos cancelados

### Cambio propuesto

**Archivo: `src/components/admin/PackageLabel.tsx`**

Filtrar `products_data` para excluir productos cancelados en las tres funciones que iteran sobre los productos:

1. **`getFormattedDescription`** (linea ~87): Filtrar `products_data` con `.filter(p => !p.cancelled)` antes de mapear las descripciones.

2. **`getTotalQuantity`** (linea ~68): Filtrar productos cancelados antes de sumar cantidades.

3. **`getPackagePrice`** (linea ~52): Filtrar productos cancelados antes de calcular el precio total.

### Detalle tecnico

En cada una de las tres funciones, cambiar:
```
pkg.products_data.map/reduce(...)
```
por:
```
pkg.products_data.filter(p => !p.cancelled).map/reduce(...)
```

En `getFormattedDescription`, ademas hay que ajustar el indice de `customDescriptions` para que use el indice original (del array sin filtrar) y no el indice filtrado, o alternativamente re-indexar. La solucion mas simple es filtrar primero y re-numerar.

Esto sigue el mismo patron ya establecido en `QuoteDialog`, `ProductReceiptConfirmation`, y `usePackageActions` donde los productos cancelados se excluyen de calculos y confirmaciones.
