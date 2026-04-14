
Objetivo: corregir el problema restante donde `PackageRequestForm` y `TripForm` siguen pidiendo doble tap en móvil, mientras los modales de edición sí funcionan con un solo toque.

Hallazgo clave:
- La diferencia importante no parece ser el contenido del formulario, sino el contenedor móvil:
  - `PackageRequestForm` y `TripForm` usan `Sheet` fullscreen desde abajo.
  - Los modales que sí funcionan usan `Dialog`.
- Además, en ambos forms todavía hay algunos elementos interactivos dentro del sheet que pueden seguir activando estados visuales antes del click real, especialmente en cards seleccionables y CTAs secundarios.

Plan de corrección

1. Endurecer el wrapper móvil del `Sheet`
- Editar `src/components/ui/sheet.tsx` para aplicar las mismas protecciones táctiles que ya funcionan en `Dialog`:
  - `touch-manipulation`
  - `-webkit-tap-highlight-color: transparent`
  - `cursor-pointer` en el close
  - soporte para `onPointerDownOutside` como en `Dialog`
  - prevenir autofocus inicial en móvil si está robando el primer tap (`onOpenAutoFocus`)
- Esto ataca la diferencia estructural entre “edit modal funciona” vs “package/trip form falla”.

2. Hacer touch-safe el contenido raíz de ambos forms
- `src/components/PackageRequestForm.tsx`
- `src/components/TripForm.tsx`
- Agregar clases touch-safe al contenedor principal del sheet y a la zona scrollable:
  - `touch-manipulation`
  - `select-none` solo donde aplique a CTAs/cards
- Mantener inputs editables normales, pero asegurar que los botones de navegación y selección no queden atrapados por comportamiento táctil del contenedor.

3. Revisar interacciones que siguen siendo más frágiles dentro de estos 2 forms
- En `PackageRequestForm`:
  - cards de tipo de pedido
  - radios/labels clickeables
  - botones `Siguiente`, `Atrás`, `Enviar`
- En `TripForm`:
  - cards de método de entrega
  - bloque de términos
  - link/botón “Leer términos”
  - submit final
- Donde haga falta, convertir wrappers clickeables en targets más semánticos (`button` / `label`) o reforzar el handler sobre el elemento visible real.

4. Alinear hover/focus mobile en los puntos que aún pueden interferir
- En `TripForm` todavía quedan clases como:
  - `group-hover:text-black/80`
  - `hover:text-black/80`
- Cambiarlas a versión desktop-only:
  - `sm:group-hover:*`
  - `sm:hover:*`
- Revisar lo mismo en cualquier CTA residual de `PackageRequestForm`.

5. Verificación específica
- Probar solo los flujos críticos que hoy fallan:
  - abrir `PackageRequestForm` en móvil y avanzar step por step con un solo tap
  - abrir `TripForm` en móvil y seleccionar delivery method con un solo tap
  - CTA final de ambos forms
  - link de términos en `TripForm`
- Comparar contra un modal de edición que ya funciona para confirmar que el comportamiento quedó consistente.

Archivos a tocar
- `src/components/ui/sheet.tsx`
- `src/components/PackageRequestForm.tsx`
- `src/components/TripForm.tsx`

Resultado esperado
- Los dos forms más importantes (`package` y `trip`) deben responder al primer toque en móvil, igual que el modal de editar pedido y el resto de modales.
