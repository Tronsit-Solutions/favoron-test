
Objetivo: identificar la causa exacta del doble tap en móvil y corregir solo la pieza responsable, sin reescribir los formularios.

Hallazgo principal
- El diálogo del Package Form está en:
  - `src/components/PackageRequestForm.tsx`
  - móvil: `Sheet` en líneas ~1599-1615
  - desktop: `Dialog` en líneas ~1620-1651
- El diálogo del Trip Form está en:
  - `src/components/TripForm.tsx`
  - móvil: `Sheet` en líneas ~1487-1500
  - desktop: `Dialog` en líneas ~1505-1518

Resultado del análisis
- En móvil, ambos formularios ya usan:
  - `Sheet modal={false}`
  - `hideOverlay`
- Eso significa que el `Sheet` del Package Form y el del Trip Form NO son el problema principal ahora.
- No encontré `onTouchStart`, `onMouseDown`, `stopPropagation()` ni `preventDefault()` cerca de la selección de “¿Qué tipo de pedido necesitas?” ni en los wrappers inmediatos del form que expliquen el primer tap perdido.
- La card problemática del Package Form está en:
  - `src/components/PackageRequestForm.tsx` líneas ~691-756
  - usa `<button type="button" onClick={...}>`
  - no tiene interceptores raros; el click en sí está bien

Causa raíz encontrada
- `Dashboard.tsx` abre automáticamente un onboarding al entrar a `/dashboard/package` y `/dashboard/trip`:
  - `src/components/Dashboard.tsx` líneas ~240-250
- Ese onboarding renderiza `OnboardingBottomSheet` globalmente:
  - `src/components/Dashboard.tsx` líneas ~1211-1227
- `OnboardingBottomSheet` usa Radix `Dialog` con `modal={true}` por defecto:
  - `src/components/onboarding/OnboardingBottomSheet.tsx` línea ~81
- Y `DialogContent` siempre monta `DialogOverlay`:
  - `src/components/ui/dialog.tsx` líneas ~34-36

Qué significa en DOM
- Encima del formulario puede existir otra capa Radix:
  1. Sheet del formulario
  2. Dialog del onboarding
  3. Overlay/backdrop del onboarding cubriendo viewport
- Esa capa superior sí puede comerse el primer tap o forzar foco antes de dejar pasar la interacción real.
- Esto encaja exactamente con el síntoma: los botones del form parecen “requerir doble tap”, pero el primer tap realmente cae en la capa modal superior.

Eventos interceptores encontrados
- En los formularios, no encontré interceptores sospechosos alrededor del tap inicial.
- En `src/components/ui/dialog.tsx` sí existe:
  - `onOpenAutoFocus` en móvil
  - `onPointerDownOutside`
- Pero el problema no es la card del formulario; es que el onboarding usa ese `Dialog` modal por encima del form.

Fix mínimo y específico
1. Corregir `Dashboard.tsx`
- Evitar que el onboarding se abra automáticamente mientras el usuario está en las rutas `/dashboard/package` o `/dashboard/trip`.
- Mantener el onboarding manual desde el botón de ayuda si quieren seguir mostrándolo.
- Este es el cambio más pequeño y más alineado con la causa real.

2. No tocar la lógica del form salvo que haga falta
- No reescribir `PackageRequestForm` ni `TripForm`.
- No cambiar la card “¿Qué tipo de pedido necesitas?” porque su `onClick` no es la causa.

3. Solo si hiciera falta como respaldo
- Pasar `modal={false}` al `OnboardingBottomSheet` cuando se abra desde encima del form móvil.
- Pero primero haría el ajuste en `Dashboard.tsx`, porque ahí está el disparador root-cause.

Archivo exacto a modificar
- `src/components/Dashboard.tsx`

Cambio concreto
- Reemplazar la apertura automática actual:
  - `if (isPackageFormOpen && ...) setShowShopperOnboarding(true)`
  - `if (isTripFormOpen && ...) setShowTravelerOnboarding(true)`
- por una condición que no abra onboarding cuando el usuario ya está dentro del flujo móvil del formulario por ruta.

Resultado esperado
- El form de paquetes y el form de viajes seguirán usando su `Sheet` no modal actual.
- Ya no habrá un `DialogOverlay` extra montado encima del contenido del form.
- La selección de “¿Qué tipo de pedido necesitas?” y demás elementos deberían responder con un solo tap, porque el primer toque ya no será absorbido por la capa de onboarding.
