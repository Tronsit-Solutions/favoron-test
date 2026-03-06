

## Mostrar paquetes individuales en el historial de lotes

Actualmente el historial muestra un resumen por lote (cantidad de etiquetas + nombres de shoppers). El usuario quiere ver cada paquete individual dentro de cada lote.

### Cambios en `src/components/operations/LabelCartBar.tsx` y `src/components/operations/OperationsLabelsTab.tsx`

Refactorear el `HistoryDialog` en ambos archivos para:

1. **Expandir cada lote** con una lista de paquetes individuales debajo del encabezado del lote
2. Cada paquete mostrará:
   - ID corto del paquete (8 caracteres)
   - Nombre del shopper
   - Descripción del producto (primer producto o `item_description`)
   - Número de etiqueta si existe
3. Usar un `Collapsible` o simplemente mostrar la lista directamente debajo del header del lote
4. Mantener los botones de Restaurar/Eliminar a nivel de lote

### Estructura visual por lote
```text
┌─────────────────────────────────────────────────┐
│ 6 etiquetas   6 mar 2026, 10:23    [Restaurar] │
│                                                 │
│  #0042  Rodrigo Noguera — iPhone 16 Pro Max     │
│  #0043  Andrea Martinez — AirPods Pro           │
│  #0044  Edison Castillo — MacBook Air M3        │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

Los datos ya están disponibles en `batch.items` (cada `LabelCartItem` tiene `id`, `shopper_name`, `item_description`, `products_data`, `label_number`), solo hay que renderizarlos.

