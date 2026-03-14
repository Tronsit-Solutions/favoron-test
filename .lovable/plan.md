
Objetivo: corregir de forma definitiva el overflow lateral (derecha) en tarjetas de pedidos/viajes en móvil, incluyendo el “borde” que se sale o se recorta.

1) Diagnóstico (por qué sigue pasando)
- El fix anterior se enfocó en `overflow-x-hidden` en contenedores padre y `px-0`, lo cual evita scroll horizontal pero también puede recortar bordes/rings.
- En `CollapsiblePackageCard` hay estados con `ring-2` (ring externo) que visualmente parecen “overflow de borde” en pantallas estrechas.
- Hay layouts móviles con columnas internas (`flex + ml + botones`) que todavía pueden empujar contenido al límite derecho.

2) Cambios a implementar

A) `src/components/Dashboard.tsx`
- En la sección de `packages` (y paralelo en `trips`), mantener ancho completo pero evitar clipping agresivo:
  - Reemplazar `overflow-x-hidden` en wrappers de tabs/lista por una estrategia de contención sin recortar bordes (ajustar a `overflow-visible`/`overflow-x-clip` según el bloque).
  - Añadir padding horizontal móvil consistente en el contenedor de lista (no `px-0` puro) para que el borde no toque el borde físico del viewport.
  - Aplicar utilidades de safe-area horizontal (`mobile-safe-padding` o equivalente) en el contenedor de tarjetas.

B) `src/components/dashboard/CollapsiblePackageCard.tsx`
- Forzar caja segura móvil en raíz de la tarjeta:
  - `w-full max-w-full min-w-0 box-border overflow-hidden`.
- Corregir el “borde con overflow” en estados destacados:
  - Cambiar rings externos a internos (`ring-inset`) en la variante verde (`delivered_to_office`), manteniendo el estilo visual sin desbordar.
- Reforzar contenedores móviles internos críticos (header/acciones) con `min-w-0 max-w-full` para evitar empujes laterales por contenido largo.

C) Componentes similares (auditoría y ajuste)
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`
  - Mantener `w-full`, `box-border`, `overflow-hidden`.
  - Cambiar `ring-1` a `ring-1 ring-inset` donde aplique.
- `src/components/dashboard/TripCard.tsx`
  - Asegurar `w-full min-w-0 box-border overflow-hidden` en card raíz.
- Revisar cualquier card “highlighted” con ring en dashboard y unificar patrón “inset + full width + box-border”.

3) Detalle técnico (resumen)
- Patrón estándar para cards móviles:
  - `w-full max-w-full min-w-0 box-border overflow-hidden`
  - Sin widths fijos en móvil.
  - Rings de énfasis con `ring-inset` para evitar “borde que se sale”.
- Patrón de contenedor:
  - Padding horizontal móvil consistente + safe area.
  - Evitar depender solo de `overflow-x-hidden` para “ocultar” problemas.

4) Validación (E2E)
- Probar en viewport 390x797 (`/dashboard?tab=packages`) con:
  - Tarjeta normal
  - Tarjeta destacada en verde (`delivered_to_office`)
  - Tarjeta con textos largos/estatus largo
  - Menú de 3 puntos abierto/cerrado
- Confirmar:
  - No recorte del borde derecho
  - No scroll horizontal
  - Todo dentro del safe area
