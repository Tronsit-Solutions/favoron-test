

## Eliminar "Archivar" y usar solo "Cancelar" (sin migrar legacy)

### Que cambia

El boton "Archivar" desaparece por completo de la UI. Los paquetes que el shopper ya no quiere se cancelan con el boton existente "Cancelar pedido". Los paquetes cancelados dejan de aparecer en el dashboard activo y pasan al historial automaticamente.

Los ~101 paquetes legacy con status `archived_by_shopper` se quedan como estan -- siguen apareciendo en el historial con su label actual.

### Archivos a modificar

**1. `src/components/Dashboard.tsx`**
- Eliminar la funcion `handleArchivePackage` completa (lineas 442-490)
- Dejar de pasar `onArchivePackage={handleArchivePackage}` al componente `CollapsiblePackageCard` (linea 728)
- Agregar `cancelled` al filtro del dashboard activo: los paquetes cancelados ya no se muestran en el dashboard, van directo al historial
  - Cambiar `pkg.status === 'completed' || pkg.status === 'archived_by_shopper'` por `pkg.status === 'completed' || pkg.status === 'archived_by_shopper' || pkg.status === 'cancelled'`
  - Esto se aplica en dos lugares (lineas 670 y 687)

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Eliminar la prop `onArchivePackage` de la interfaz y destructuring
- Eliminar el `DropdownMenuItem` de "Archivar" en el menu desplegable (lineas 327-333)
- Eliminar los botones "Archivar y mover al historial" en los banners de paquetes cancelados (lineas 441-454 y 700-713)
- Eliminar el import de `Archive` de lucide-react

**3. `src/components/profile/PackageHistory.tsx`**
- Sin cambios -- ya incluye `cancelled` y `archived_by_shopper` en el historial

**4. Tabla financiera, status badges, etc.**
- Sin cambios -- los legacy `archived_by_shopper` siguen siendo reconocidos en mapas de status y filtros financieros

### Flujo resultante

```text
Paquete activo en dashboard
   |
   |-- Shopper lo cancela ("Cancelar pedido") --> status = 'cancelled' --> sale del dashboard, aparece en historial
   |-- Se completa --> status = 'completed' --> sale del dashboard, aparece en historial
```

### Mensajes de la UI actualizados

El boton "Cancelar pedido" ya existe con su logica de validacion (`canCancelPackage`). Los toasts de confirmacion ya dicen "Pedido cancelado". No hace falta cambiar mensajes.

