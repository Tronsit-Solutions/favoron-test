
Objetivo: arreglar el caso donde el botón “Confirmar Match” aparentemente se puede pulsar, pero el diálogo se cierra sin toast, sin logs y sin ejecutar el match.

Lo que ahora sugiere el código:
- La lógica de estabilidad ya existe:
  - reset por `packageId` real
  - migración automática de tip
  - guardado contra sync externo mientras el diálogo está abierto
- Pero el síntoma nuevo es distinto:
  - no aparecen logs `[MATCH]`
  - no aparecen logs `[DASH]`
  - no hay toast
  - el modal sí se cierra
- Eso apunta a que el cierre está ocurriendo en la capa del diálogo/UI antes de que el flujo de match llegue realmente a ejecutarse o a dejar rastro.

Problema más probable:
1. `AdminMatchDialog` usa `Dialog open={showMatchDialog} onOpenChange={handleCloseDialog}`.
2. `handleCloseDialog` cierra siempre el modal, sin distinguir si Radix lo llamó por overlay/close button/Escape o por otra transición.
3. Como no hay logs visibles ni en `handleMatch` ni en `AdminDashboard.handleMatch`, el siguiente paso correcto no es “parchar más lógica de negocio”, sino instrumentar la frontera exacta del click/cierre.
4. También hay un riesgo de carrera:
   - `handleMatch` pone `isSubmittingMatch=true`
   - pero el `Dialog` podría cerrar por `onOpenChange(false)` antes de que el árbol termine de procesar el flujo, especialmente si algún evento del contenido o close control se dispara en paralelo.

Plan de implementación:
1. Instrumentar el click real del botón de confirmar
   - Agregar logs al inicio de `AdminMatchDialog.handleMatch` antes de cualquier condición.
   - Loggear:
     - `selectedTripIds.size`
     - `getTotalAssignedTip()`
     - `isSubmittingMatch`
     - `selectedPackage?.id`
   - Confirmar si el handler corre en absoluto.

2. Instrumentar el cierre del diálogo con causa explícita
   - Cambiar `handleCloseDialog` para registrar cuándo y por qué se intenta cerrar.
   - Hacer que `onOpenChange` reciba `open` y:
     - si `open === false`, loggear que Radix pidió cierre
     - si `isSubmittingMatch === true`, bloquear el cierre automático durante confirmación
   - Mantener cierre manual con Cancelar y X, pero diferenciarlo con logs claros.

3. Blindar el flujo de confirmación contra cierres prematuros
   - Durante `isSubmittingMatch`, deshabilitar cierre por:
     - Escape
     - click fuera
     - botón X
     - `onOpenChange(false)` automático
   - Así el modal no desaparece antes de que `onMatch` arranque o falle explícitamente.

4. Separar cierre manual vs cierre por éxito
   - Hacer que solo `AdminDashboard.handleMatch` cierre el diálogo después de iniciar correctamente el flujo.
   - En `AdminMatchDialog`, “Cancelar” debe cerrar explícitamente.
   - El botón confirmar no debe depender de ningún comportamiento implícito del `Dialog`.

5. Añadir verificación visual/funcional mínima del estado del botón
   - Loggear en render solo cuando cambie el motivo de disabled.
   - Evitar spam, pero dejar trazabilidad de:
     - `noTrips`
     - `noTip`
     - `submitting`
   - Esto sirve para distinguir “el click no entró” vs “el botón realmente ya estaba deshabilitado”.

Archivos a tocar:
- `src/components/admin/AdminMatchDialog.tsx`
  - instrumentación del botón
  - bloqueo de cierre durante submit
  - separación de causas de cierre
- `src/components/ui/dialog.tsx`
  - solo si hace falta exponer mejor el control de cierre por outside click / escape
- `src/components/AdminDashboard.tsx`
  - mantener el cierre del modal únicamente en éxito/inicio confirmado del flujo

Resultado esperado:
- Si el usuario vuelve a pulsar Confirmar, debe ocurrir una de estas dos cosas de forma visible:
  1. se ven logs de inicio y arranca el match, o
  2. se ve exactamente qué mecanismo cerró el diálogo
- El modal ya no debería desaparecer silenciosamente durante la confirmación.
- Con eso, el bug deja de ser “silencioso” y pasa a estar totalmente localizado.

Detalles técnicos:
```text
Flujo deseado

Click Confirmar
  -> AdminMatchDialog.handleMatch() log START
  -> set isSubmittingMatch = true
  -> bloquear cierre implícito del Dialog
  -> await onMatch(...)
  -> AdminDashboard.handleMatch() log START
  -> cierre controlado del modal + toast + navegación

Cierres permitidos
  - Cancelar
  - X manual
  - éxito explícito del match

Cierres bloqueados durante submit
  - onOpenChange(false) implícito
  - overlay click
  - Escape
```
