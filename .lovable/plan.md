
Objetivo: quitar por completo el doble tap del Package Form en móvil.

Diagnóstico actualizado
- El problema no está resuelto porque el `PackageRequestForm` todavía monta un `OnboardingBottomSheet` dentro del mismo flujo del formulario.
- En código, el form sigue renderizando `OnboardingBottomSheet` al final del componente, y ese onboarding usa `DialogContent`, que siempre crea su propio overlay.
- Además, `src/components/ui/dialog.tsx` todavía deja `DialogOverlay` y `DialogContent` con el mismo `z-50`, y `DialogContent` no tiene la misma protección móvil de `Sheet` (`onOpenAutoFocus`).
- `Input` y `Textarea` todavía no tienen `touch-manipulation` directo en sus primitives; hoy dependen de `.mobile-safe-form`, lo cual deja el fix incompleto si el tap cae en wrappers/labels/targets internos.

Plan de corrección

1. Eliminar la capa modal anidada dentro del Package Form
- Sacar el onboarding de `src/components/PackageRequestForm.tsx`.
- Hacer lo mismo en `src/components/TripForm.tsx` para no dejar el mismo bug en el otro flujo.
- Mostrar onboarding desde `src/components/Dashboard.tsx` antes de abrir cada form, o como modal global separado, pero nunca al mismo tiempo que el `Sheet` del formulario.

2. Endurecer `Dialog` igual que `Sheet`
- Editar `src/components/ui/dialog.tsx` para:
  - bajar `DialogOverlay` a `z-40`
  - dejar `DialogContent` en `z-50` con `pointer-events-auto`
  - agregar `touch-manipulation`
  - prevenir `onOpenAutoFocus` en móvil igual que en `Sheet`
- Esto evita que overlays/dialogs internos sigan robando el primer tap.

3. Hacer touch-safe los primitives base
- Editar:
  - `src/components/ui/input.tsx`
  - `src/components/ui/textarea.tsx`
  - revisar `select`, `radio-group`, `checkbox`, `button` para mantener consistencia
- Añadir directamente:
  - `touch-manipulation`
  - `[-webkit-tap-highlight-color:transparent]`
  - tamaño táctil mínimo donde aplique

4. Limpiar targets interactivos del Package Form
- En `src/components/PackageRequestForm.tsx` revisar y reforzar:
  - botones de tipo de pedido
  - radios de devolución
  - selects país/ciudad
  - date picker
  - cards de método de entrega
  - botones Atrás / Siguiente / Enviar
- Mantener targets semánticos (`button`, `label`, control real) y evitar wrappers ambiguos.

5. Verificación enfocada
- Probar en viewport móvil el flujo real de pedidos:
  1. abrir onboarding
  2. continuar
  3. abrir Package Form
  4. tocar input, select, radio, calendario, delivery cards y CTA final
- Criterio de éxito: todo responde al primer tap, sin necesidad de cambiar de pestaña ni tocar dos veces.

Archivos a tocar
- `src/components/Dashboard.tsx`
- `src/components/PackageRequestForm.tsx`
- `src/components/TripForm.tsx`
- `src/components/onboarding/OnboardingBottomSheet.tsx` (solo si simplifico props al mover la lógica)
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`

Resultado esperado
- En móvil, el Package Form debe funcionar con un solo tap en todos los campos y acciones.
- El onboarding deja de interferir con el formulario porque ya no habrá dos capas Radix activas al mismo tiempo.
