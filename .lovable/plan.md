

## Mejorar controles de edición y agregar layout configurable por widget

### Cambios en `GodModeDashboard.tsx`:

1. **Cambiar estilo de botones de edición**: Reemplazar los botones `variant="secondary"` (naranja) por botones con estilo ghost/outline más sutil — fondo gris claro con bordes suaves, sin colores llamativos. El botón de eliminar cambia de `destructive` a un ghost con icono rojo sutil.

2. **Layout configurable por widget (full-width vs half-width)**:
   - Agregar estado `widgetSizes: Record<string, "full" | "half">` persistido en localStorage junto con `activeWidgets`.
   - En modo edición, agregar un botón toggle (icono `Maximize2`/`Minimize2`) en cada widget para alternar entre ancho completo y medio ancho.
   - Renderizar los widgets en un grid de 2 columnas: widgets `"full"` ocupan `col-span-2`, widgets `"half"` ocupan `col-span-1`.
   - El contenedor cambia de `space-y-4` a `grid grid-cols-2 gap-4`.

3. **Persistencia**: El localStorage guardará `{ widgets: string[], sizes: Record<string, string> }` en lugar de solo el array.

