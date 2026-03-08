

## Completar orden 60ea97f0 con datos idénticos a 0ac04ea5

### Situación actual

- **0ac04ea5** (orden modelo): Tiene `estimated_price: 20`, `products_data` completo (con `estimatedPrice`, `requestType: online`, `adminAssignedTip: 80`, `itemDescription`), `quote` con serviceFee/deliveryFee/price/tip, status `received_by_traveler`
- **60ea97f0** (orden vacía): Tiene `estimated_price: 0`, `products_data` incompleto (sin precio, sin requestType, sin tip), sin `quote`, status `matched`
- Ya está asignada al viaje de Anika Erichsen (trip `573209c2`) -- correcto

### Cambio

Desplegar una Edge Function temporal que actualice `60ea97f0` con:

1. `estimated_price`: 20
2. `products_data`: copia exacta de 0ac04ea5 (`estimatedPrice: 20`, `requestType: online`, `itemDescription`, `adminAssignedTip: 80`, etc.)
3. `quote`: copia exacta (`serviceFee: 40`, `deliveryFee: 60`, `price: 80`, `totalPrice: 180`, `adminAssignedTipAccepted: true`)
4. Mantener `status: matched` (ya que esta orden aún no ha avanzado en su ciclo)
5. Mantener `matched_trip_id`, `user_id`, `delivery_deadline` actuales (ya correctos)

