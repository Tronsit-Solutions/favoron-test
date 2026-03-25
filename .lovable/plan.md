

## Validar código de Boost en tiempo real (sin bloquear el guardado del viaje)

### Problema
Actualmente el campo de boost code guarda cualquier texto sin validar si existe en `boost_codes`. El viaje siempre se guarda, pero el viajero no sabe si su código es válido hasta mucho después.

### Solución
Agregar validación en tiempo real al campo de boost code: cuando el viajero escribe un código y sale del campo (onBlur) o después de un debounce, consultar `boost_codes` para verificar si existe y está activo. Mostrar feedback visual inline (verde si válido, rojo si inválido). El viaje siempre se guarda — si el código es inválido, se guarda sin boost code (`null`).

### Cambios

**1. `src/components/TripForm.tsx`**

- Agregar estados: `boostStatus` (`idle | checking | valid | invalid`), `boostError` (string)
- En el `onChange` o `onBlur` del input de boost code, si hay texto:
  - Hacer query a `boost_codes` tabla: `.select('id').eq('code', value).eq('is_active', true).maybeSingle()`
  - Si `data` existe → `boostStatus = 'valid'`, mostrar checkmark verde
  - Si no existe → `boostStatus = 'invalid'`, mostrar mensaje "Código no válido"
- En el `handleSubmit`, si `boostStatus !== 'valid'`, enviar `boostCode: null` (no guardar código inválido)
- Feedback visual: icono Check verde cuando válido, texto rojo "Código no encontrado" cuando inválido

**2. `src/components/EditTripModal.tsx`**

- Misma lógica de validación para el campo de boost code en edición

### Resultado
- El viajero ve inmediatamente si su código es válido o no
- El viaje siempre se guarda (nunca se bloquea)
- Códigos inválidos no se guardan en la DB (se envía `null`)

