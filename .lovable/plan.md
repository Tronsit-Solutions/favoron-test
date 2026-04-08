

## Alinear diseño de "Mis Favorones" con "Mis Viajes"

### Problema
El tab de "Mis Viajes" se ve limpio con todos los bordes visibles, mientras que "Mis Favorones" tiene diferencias en padding y overflow que causan que las tarjetas se vean cortadas o desalineadas.

### Diferencias encontradas

| Propiedad | Mis Viajes (trips) | Mis Favorones (packages) |
|-----------|-------------------|--------------------------|
| TabsContent className | `space-y-6 ... overflow-x-clip px-1` | `space-y-4 sm:space-y-6 ... overflow-visible pr-4 sm:pr-0` |
| Grid className | `grid gap-6` | `grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 box-border` |

### Cambios

**`src/components/Dashboard.tsx`**

1. **Línea 844** — Cambiar el `TabsContent` de packages para usar los mismos estilos que trips:
   - De: `"space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-visible pr-4 sm:pr-0"`
   - A: `"space-y-6 min-w-0 w-full max-w-full overflow-x-clip px-1"`

2. **Línea 879** — Simplificar el grid de cards para que coincida con trips:
   - De: `"grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 box-border"`
   - A: `"grid gap-6"`

Estos dos cambios harán que el contenedor y las tarjetas de "Mis Favorones" usen exactamente el mismo spacing, padding y overflow que "Mis Viajes".

