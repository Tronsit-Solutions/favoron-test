

## Mejorar modal de Historial de Lotes

El problema es que el contenido se trunca con `truncate` y el modal es muy estrecho para mostrar la información. La imagen muestra que los nombres de shoppers se cortan y no hay forma de ver el detalle completo.

### Cambios en ambos archivos

**`src/components/operations/OperationsLabelsTab.tsx`** (líneas 428-467) y **`src/components/operations/LabelCartBar.tsx`** (líneas 414-468):

1. Ampliar el modal de `max-w-lg` a `max-w-2xl` para dar más espacio
2. Cambiar el `truncate` en la línea de nombres por `line-clamp-2` o `whitespace-normal` para que el texto haga wrap en lugar de cortarse
3. Mejorar el layout de cada batch card:
   - Mostrar el conteo de etiquetas y la fecha en una fila superior con flex
   - Mostrar los nombres de shoppers en una lista con wrap completo (sin truncar)
   - Agregar un poco más de padding y separación visual
4. Añadir un badge con el número de etiquetas para mejor visibilidad

