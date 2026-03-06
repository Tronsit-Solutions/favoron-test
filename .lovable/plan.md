

## Distinguir visualmente los paquetes anidados de los viajes

**Problema**: Los paquetes asignados bajo cada viaje usan `Card` con el mismo estilo visual que el `TripCard` padre, haciendo difícil distinguir la jerarquía.

### Cambios propuestos

**1. `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`** — Rediseñar el contenedor del paquete para que sea visualmente subordinado:
- Cambiar el `Card` por un contenedor más ligero: quitar el borde completo y usar un fondo sutil (`bg-muted/20` o `bg-slate-50`)
- Reducir el padding y el shadow para que se sienta como un sub-elemento
- Usar bordes redondeados más suaves y un borde izquierdo de color (ej. `border-l-3 border-primary/40`) en lugar del card completo
- Mantener el `ring` para acciones pendientes pero con estilo diferenciado

**2. `src/components/Dashboard.tsx`** — Ajustar el wrapper de paquetes anidados:
- Mejorar el indicador visual del contenedor padre (línea `border-l-2`) para que sea más prominente
- Agregar un fondo sutil al grupo de paquetes (`bg-muted/10 rounded-lg p-2`)

### Resultado visual
- **Trip cards**: Cards blancos con borde y shadow completo (como ahora)
- **Package cards anidados**: Fondo sutil sin borde exterior, con acento de color en borde izquierdo, tipografía ligeramente más pequeña — claramente subordinados al viaje padre

