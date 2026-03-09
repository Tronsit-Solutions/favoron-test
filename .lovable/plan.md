

## Eliminar el rectángulo gris del área de acciones en TravelerPackagePriorityActions

El rectángulo gris proviene del `div` en la línea 49 de `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx` con clase `p-3 bg-muted/30 border rounded-lg`.

### Cambio

**`src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx`** (línea 49):
- Cambiar `className="p-3 bg-muted/30 border rounded-lg"` a `className=""` (sin fondo, sin borde, sin padding extra), manteniendo todo el contenido interno intacto incluyendo el botón "Confirmar recibido".

