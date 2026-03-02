
Objetivo: corregir el scroll del dropdown del `Combobox` también en desktop (rueda/trackpad), no solo en móvil.

Plan de implementación:

1) Confirmar y atacar causa raíz (no solo estilos de touch)
- La falla persiste porque el `Combobox` se usa dentro de `Dialog` (`TripForm` y `EditTripModal`) y su `PopoverContent` está porteado al `body`.
- En este escenario, el lock de scroll del modal puede bloquear eventos de rueda/scroll del contenido porteado.

2) Hacer el `PopoverContent` configurable para uso dentro de modales
- Archivo: `src/components/ui/popover.tsx`
- Extender `PopoverContent` con un prop opcional (ej. `portalled?: boolean`, default `true`) para mantener compatibilidad global.
- Cuando `portalled={false}`, renderizar `PopoverPrimitive.Content` sin `Portal`, para que quede dentro del árbol del `Dialog` y reciba scroll correctamente.

3) Exponer esa opción en `Combobox`
- Archivo: `src/components/ui/combobox.tsx`
- Agregar prop opcional (ej. `portalled?: boolean`) y pasarlo a `PopoverContent`.
- Mantener las mejoras ya aplicadas (`max-h-[60vh]`, `overflow-hidden`, z-index).

4) Aplicar modo “no portal” en comboboxes dentro de diálogos
- Archivo: `src/components/TripForm.tsx`
- Archivo: `src/components/EditTripModal.tsx`
- En los `Combobox` de país/ciudad usados dentro de esos `Dialog`, enviar `portalled={false}`.
- Esto corrige scroll de lista sin romper comboboxes fuera de modal.

5) Refuerzo de comportamiento de scroll en la lista
- Archivo: `src/components/ui/command.tsx`
- Mantener `overflow-y-auto`, `overscroll-contain`, `WebkitOverflowScrolling`.
- Añadir control de propagación de rueda en la lista (captura) para evitar que el contenedor padre robe el scroll cuando haya contenido desplazable.

Validación funcional (manual):
- Abrir `Registrar Nuevo Viaje` en `/dashboard/trip`.
- Abrir ciudad de origen/destino con listas largas.
- Verificar scroll con:
  - rueda de mouse
  - trackpad
  - arrastre de scrollbar
  - teclado (flechas / PgDown)
- Repetir en `EditTripModal`.
- Confirmar que clicks/selección siguen funcionando y que el dropdown sigue sobre el overlay (z-index correcto).

Detalles técnicos (resumen):
```text
Problema:
Dialog (scroll lock activo) + Popover portaled al body + CommandList scrollable
=> eventos de scroll/wheel pueden no aplicarse al dropdown.

Solución:
- Permitir PopoverContent sin Portal en contextos de Dialog.
- Usar Combobox portalled={false} dentro de modales.
- Mantener y reforzar estilos/handlers del contenedor scrollable (CommandList).
```
