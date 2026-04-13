

## Plan: Corregir almacenamiento de razón de rechazo de viajero

### Problema
La función legacy `traveler_reject_assignment` (linea 66) escribe la razón del viajero en el campo `rejection_reason`, que debería ser exclusivo para rechazos de shoppers/admin. La función v2 no tiene este bug. El resultado es que en la tabla de cancelados aparecen razones como "El tip ofrecido es muy bajo" como si fueran del shopper.

### Cambios

**1. Migración SQL** — Corregir la función `traveler_reject_assignment`:
- Quitar `rejection_reason = _rejection_reason` de la linea 66 del UPDATE. La razón ya se guarda correctamente en `traveler_rejection` JSONB.

**2. Migración SQL** — Limpiar datos existentes:
- Para paquetes donde `rejection_reason` coincide con `traveler_rejection->>'rejection_reason'`, limpiar `rejection_reason` a NULL (ya que fue escrito incorrectamente por el traveler RPC).

**3. `src/hooks/useCancelledPackages.ts`** — Mejorar la lógica de `computed_reason`:
- Cambiar la prioridad para distinguir entre razones de shopper vs viajero:
  - Si `rejection_reason` existe → mostrar como "Shopper: {razón}"
  - Si `traveler_rejection.reason` existe → mostrar como "Viajero: {razón}"  
  - Si `quote_rejection.reason` existe → mostrar como "Cotización: {razón}"
- Esto da contexto claro de quién rechazó.

### Resultado
- Las razones de rechazo de viajeros ya no contaminarán el campo `rejection_reason`
- Los datos históricos incorrectos se limpiarán
- La tabla de cancelados mostrará claramente quién rechazó y por qué

