

## Problema

En `CollapsiblePackageCard.tsx` (línea 377), la `Card` tiene `overflow-hidden` que recorta la burbuja roja de notificación posicionada con `absolute -top-2 -left-2`.

## Solución

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**

Envolver la `Card` en un `div` con `relative` y mover el `NotificationBadge` fuera de la Card (al wrapper), para que no sea recortado por el `overflow-hidden`. El wrapper necesita un pequeño padding top/left para dar espacio al badge.

Alternativa más simple: cambiar `overflow-hidden` a `overflow-visible` en la Card. Pero esto podría afectar otros contenidos internos que dependen del overflow hidden.

**Enfoque recomendado** (mínimo cambio):
- Línea ~376-378: Envolver en un `div className="relative"` con padding top/left de 2
- Mover el `NotificationBadge` al wrapper div en lugar de dentro de la Card
- Agregar `z-20` al badge para asegurar que quede por encima de todo

