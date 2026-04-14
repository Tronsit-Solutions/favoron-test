<final-text>
Objetivo: quitar definitivamente el doble tap en móvil dentro del Package Form, especialmente en botones, selects, radios y tarjetas de selección.

Hallazgo principal
- `PackageRequestForm` está abriendo dos capas modales al mismo tiempo:
  - el `Sheet` del formulario
  - el `OnboardingBottomSheet` interno
- Ese patrón de modales Radix apilados es el candidato más fuerte al bug: en la sesión se ve bloqueo global de pointer events/scroll lock, consistente con una capa modal interfiriendo con la otra.
- Además, dentro del Package Form todavía hay selecciones hechas con `div onClick` y algunos `hover:` sin `sm:` en tarjetas de entrega, lo que empeora el comportamiento táctil en iPhone/Android.

Plan de corrección

1. Eliminar la colisión entre onboarding y form
- Dejar de montar el onboarding encima del `Sheet` del formulario.
- Cambiar el flujo para que el onboarding no conviva como segundo modal activo dentro de `PackageRequestForm`.
- La solución más segura es mover ese onboarding fuera del form (o mostrarlo antes de abrir el form), para que el `Sheet` sea la única capa modal activa.

2. Volver touch-safe las selecciones del Package Form
- En `src/components/PackageRequestForm.tsx`, convertir las cards de método de entrega y devolución de `div onClick` a `button type="button"`.
- Agregar `touch-manipulation`, feedback `active:` y hover solo desktop (`sm:hover:`).
- Mantener un único target clickeable por opción.

3. Endurecer los controles usados dentro del sheet
- Revisar y ajustar los primitives que usa el form para móvil:
  - `src/components/ui/select.tsx`
  - `src/components/ui/popover.tsx`
  - `src/components/ui/radio-group.tsx`
  - `src/components/ui/checkbox.tsx`
- Añadir clases y comportamiento táctil consistentes para que no haya primer tap consumido por foco/hover.

4. Corregir remanentes de hover mobile en el Package Form
- Reemplazar los `hover:` restantes por `sm:hover:` dentro del form, especialmente en tarjetas de entrega y enlaces secundarios.

5. Evitar regresión en Trip Form
- El mismo patrón de onboarding anidado existe en `TripForm`, así que aplicaría la misma corrección estructural allí para no dejar el mismo bug vivo en el otro flujo crítico.

Archivos a tocar
- `src/components/PackageRequestForm.tsx`
- `src/components/TripForm.tsx`
- `src/components/Dashboard.tsx` si muevo el onboarding fuera del form
- `src/components/ui/select.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/checkbox.tsx`

Resultado esperado
- En móvil, el Package Form debe responder al primer tap en:
  - tipo de pedido
  - radios
  - selects de país/ciudad
  - date picker
  - método de entrega
  - botones Atrás / Siguiente / Enviar

Verificación
- Probar el flujo completo en viewport móvil realista:
  1. abrir Package Form
  2. cerrar o completar onboarding
  3. seleccionar opciones en cada step con un solo tap
  4. abrir dropdowns/calendario con un solo tap
  5. avanzar hasta submit sin dobles taps
</final-text>