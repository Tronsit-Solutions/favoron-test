

## Crear orden de cobro para Nicte Portillo

### Datos del viaje
- **Viajera**: Nicte Portillo (13ce954f-0d26-4b83-8411-8c52efb5a64a)
- **Viaje**: Houston a Guatemala City (662b8f5b-145d-4de4-bd75-2bd640a65b41)
- **Monto acumulado**: Q280.00 (3 paquetes entregados: Mittens Q80, Whoop Band Q130, Vestido Q70)

### Datos bancarios (de la imagen)
- **Titular**: PORTILLO ESCOBAR NICTE ALEXANDRA
- **Banco**: Banco Industrial
- **Numero de cuenta**: 0142077360
- **Tipo de cuenta**: Monetaria

### Accion
Insertar un registro en la tabla `payment_orders` con:
- `traveler_id`: 13ce954f-0d26-4b83-8411-8c52efb5a64a
- `trip_id`: 662b8f5b-145d-4de4-bd75-2bd640a65b41
- `amount`: 280
- `bank_name`: Banco Industrial
- `bank_account_holder`: PORTILLO ESCOBAR NICTE ALEXANDRA
- `bank_account_number`: 0142077360
- `bank_account_type`: monetaria
- `status`: pending

Tambien actualizar el campo `payment_order_created` a `true` en `trip_payment_accumulator` para el registro correspondiente.

