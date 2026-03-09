

## Unificar ícono de editar dentro del menú de 3 puntos

Reemplazar el botón separado de editar (lápiz) y el botón de 3 puntos que abre directamente el detalle, por un **DropdownMenu** en los 3 puntos con dos opciones:

1. **Editar viaje** (solo visible si `canEdit`) → abre `TripEditSelectionModal`
2. **Ver detalle** → abre `TripDetailModal`

### Cambios en `src/components/dashboard/TripCard.tsx`

- Importar `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` de `@/components/ui/dropdown-menu`
- Reemplazar el bloque de botones (líneas 96-116) por un solo `DropdownMenu` con trigger de `MoreHorizontal`
- Dentro del menú: opción "Editar viaje" (con ícono Pencil, condicional a `canEdit`) y "Ver detalle" (con ícono Eye o similar)
- Eliminar el botón separado de Pencil
- Limpiar imports no usados si aplica

