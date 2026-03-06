

## Separar paquetes en cards individuales con restauración individual

### Cambios

**1. `src/hooks/useOperationsData.tsx`**
- Agregar función `restoreItemFromHistory(batchId, itemId)` que restaura un solo item de un batch al carrito actual
- Si después de restaurar el item el batch queda vacío, eliminarlo automáticamente del historial

**2. `src/components/operations/LabelCartBar.tsx` — HistoryDialog**
- Refactorear la lista de items dentro de cada batch: cada item pasa a ser un mini-card con borde, padding, y layout claro
- Cada card muestra: número de etiqueta, nombre del shopper, descripción del producto
- Cada card tiene su propio botón "Restaurar" individual (icono RotateCcw pequeño)
- Mantener el botón "Restaurar todo" a nivel de lote en el header
- Eliminar `truncate` para que el texto sea completamente visible

**3. `src/components/operations/OperationsLabelsTab.tsx` — History Dialog inline**
- Aplicar los mismos cambios de UI que en LabelCartBar
- Pasar la nueva prop `onRestoreItem` para restauración individual

### Estructura visual

```text
┌─ Lote ──────────────────────────────────────────┐
│ 6 etiquetas  6 mar 2026, 10:23  [Restaurar todo]│
│                                                  │
│ ┌──────────────────────────────────────────┐     │
│ │ #0423  Rodrigo Noguera              [↺] │     │
│ │ Carregador de Bateria                    │     │
│ └──────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────┐     │
│ │ #0427  Andrea Nicolle Martinez      [↺] │     │
│ │ iPhone 17 pro Max Silver 256GB           │     │
│ └──────────────────────────────────────────┘     │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

### Props nuevas
- `onRestoreItem: (batchId: string, itemId: string) => void` se pasa desde Operations.tsx → LabelCartBar/OperationsLabelsTab → HistoryDialog

