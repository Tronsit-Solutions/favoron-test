

## Problema: Historial de etiquetas inaccesible

El botón de "Historial" de lotes de etiquetas solo aparece como un pequeño botón flotante en la esquina inferior derecha cuando el carrito está vacío y hay historial. Esto lo hace prácticamente invisible, especialmente en la vista de Recepción donde el contenido ocupa toda la pantalla.

## Plan

**Modificar `src/components/operations/LabelCartBar.tsx`**:

1. **Mover el acceso al historial a la barra principal**: Cuando el carrito tiene items, el botón de historial ya aparece en la barra inferior — esto está bien. El problema es cuando el carrito está vacío.

2. **Reemplazar el botón flotante invisible** (líneas 53-75) por una barra fija más visible en la parte inferior, similar a la barra del carrito pero más sutil, con el botón de "Historial" centrado y prominente.

3. **Alternativa más robusta**: Agregar un acceso al historial directamente en la pestaña "Etiquetas" (`OperationsLabelsTab.tsx`) como un botón en el header, para que siempre sea accesible independientemente del estado del carrito. Esto es más intuitivo ya que el historial está relacionado con las etiquetas.

### Enfoque elegido: Ambos

- En `LabelCartBar.tsx`: Hacer el botón flotante más grande y visible (pill style con fondo sólido).
- En `OperationsLabelsTab.tsx`: Agregar un botón "Historial de lotes" junto al botón de refresh, que abra el mismo `HistoryDialog`. Esto requiere pasar `labelHistory`, `restoreFromHistory` y `deleteFromHistory` al tab de Etiquetas.

### Archivos a modificar
- `src/components/operations/LabelCartBar.tsx` — Mejorar visibilidad del botón flotante
- `src/components/operations/OperationsLabelsTab.tsx` — Agregar botón de historial en el header
- `src/pages/Operations.tsx` — Pasar props de historial al tab de Etiquetas

