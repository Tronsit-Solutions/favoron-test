

## Fix: Espacio desperdiciado en barra de pestañas

### Problema
El `TabsList` usa `grid-cols-7` pero solo hay 6 pestañas, dejando una columna vacía.

### Cambio
**`src/components/AdminDashboard.tsx`** (línea 569): Cambiar `grid-cols-7` a `grid-cols-6`.

