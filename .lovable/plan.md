

## Botón de tips siempre visible + cobro deshabilitado en modal

### Cambios

**1. `src/components/dashboard/TripCard.tsx` (línea 82)**
- Cambiar `shouldShowTipsButton` a solo `isOwner` para que siempre sea visible cuando el usuario es dueño del viaje.

**2. `src/components/dashboard/TripTipsModal.tsx`**
- Ya tiene la lógica correcta: el botón "Solicitar cobro" solo se habilita cuando `isAllDelivered && !tripPayment.payment_order_created && accumulatedAmount > 0`.
- Cuando no se cumplen las condiciones, ya muestra un mensaje informativo con ícono de reloj.
- No requiere cambios.

