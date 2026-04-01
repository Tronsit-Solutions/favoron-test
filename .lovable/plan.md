

## Fix: Permitir editar Fecha Límite siempre (no solo fuera del modo edición)

### Problema
El botón de edición de Fecha Límite está condicionado a `{!editMode && (...)}`, lo que lo oculta cuando el admin está en modo de edición de productos. En el screenshot se ve que los campos de producto son editables (modo edición activo), por lo que el ícono de lápiz no aparece.

### Solución

**Archivo: `src/components/admin/PackageDetailModal.tsx`** (línea 2341)

Eliminar la condición `{!editMode && (` y su cierre `)}` correspondiente, dejando el `Popover` siempre visible. La edición de fecha límite es inline e independiente del modo edición de productos, por lo que no hay conflicto.

Cambio: quitar las líneas de guarda `!editMode` (línea 2341 y su cierre en ~2370), manteniendo el `Popover` completo.

