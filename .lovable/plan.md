

## Mostrar nombre del pedido en el buscador de operaciones

### Problema
El buscador ya tiene una funcion `getProductNames()` que intenta mostrar el nombre de los productos, pero busca los campos `name` y `description` dentro de `products_data`, cuando el campo real se llama `itemDescription`. Por eso aparecen vacios.

### Cambio

**Archivo: `src/components/operations/OperationsSearchTab.tsx`**

Corregir la funcion `getProductNames` (linea ~122) para leer el campo correcto:

```
// Antes (incorrecto):
.map((p: any) => p.name || p.description)

// Despues (correcto):
.map((p: any) => p.itemDescription || p.name || p.description)
```

Esto hara que cada tarjeta de paquete muestre el nombre del producto (ej: "Mouse Mover USB, Tabletas de cloruro de sodio") debajo de los badges de etiqueta y estado, tal como ya esta maquetado pero sin datos.

### Resultado
- Los nombres de productos apareceran en cada resultado de busqueda
- Se mantiene el fallback a `item_description` para paquetes sin `products_data`

