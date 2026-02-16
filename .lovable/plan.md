

## Recalcular acumulador al momento de crear la orden de pago

### Problema raiz
Cuando el viajero crea su orden de cobro, el sistema usa el monto del acumulador (`tripPayment.accumulated_amount`) que pudo haberse calculado dias antes, cuando no todos los paquetes estaban entregados. Los paquetes que se completan despues no actualizan el acumulador automaticamente.

### Solucion propuesta
Recalcular el acumulador **justo antes** de crear la orden de pago. Esto garantiza que el monto siempre refleje todos los paquetes entregados al momento de la solicitud.

### Cambios

**1. Frontend: `src/hooks/useTripPayments.tsx`**

En la funcion `createPaymentOrder`, antes de llamar al RPC `create_payment_order_with_snapshot`:
- Llamar a `createOrUpdateTripPaymentAccumulator(tripId, user.id)` para recalcular el acumulador
- Luego volver a leer el acumulador actualizado de la base de datos
- Usar el monto recalculado (no el valor viejo de `tripPayment.accumulated_amount`)

```text
// Flujo actual:
1. Tomar tripPayment.accumulated_amount (puede estar desactualizado)
2. Crear orden de pago con ese monto

// Flujo corregido:
1. Recalcular acumulador con createOrUpdateTripPaymentAccumulator()
2. Leer el acumulador actualizado de la base de datos
3. Crear orden de pago con el monto fresco
```

**2. SQL: `create_payment_order_with_snapshot`**

Agregar la captura de `admin_assigned_tip` en el snapshot de `historical_packages` para que el snapshot contenga toda la informacion necesaria para calculos futuros:

```text
jsonb_build_object(
  'package_id', p.id,
  'item_description', p.item_description,
  'status', p.status,
  'quote', p.quote,
  'products_data', p.products_data,
  'admin_assigned_tip', p.admin_assigned_tip  -- AGREGAR
)
```

### Por que esta solucion es mejor que un trigger

- **Mas simple**: No requiere un trigger complejo que se ejecute en cada cambio de estado de paquete
- **Mas eficiente**: Solo recalcula cuando realmente importa (al crear la orden)
- **Punto unico de verdad**: El calculo ocurre exactamente cuando se necesita, no de forma reactiva
- **Sin carga extra**: No agrega procesamiento a cada actualizacion de paquete

### Impacto
- Cualquier paquete que se complete entre la ultima recalculacion y la solicitud de pago sera incluido automaticamente
- Los casos como los de Ana Quezada, Bruce Betancourt y Maximiliano Rodriguez no se repetiran
- No requiere cambios en la logica de admin ni en triggers existentes

