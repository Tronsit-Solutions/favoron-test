

## Crear orden de cobro para Alejandra De Leon Fernandez

### Datos confirmados
- **Viajera**: Alejandra De Leon Fernandez (`2622016c`)
- **Viaje**: Miami → Guatemala City (`80f8400b`)
- **Monto acumulado**: Q170 (2 paquetes entregados)
- **Banco**: Industrial, Ahorros
- **Titular**: Alejandra De Leon
- **Cuenta**: 3707566

### Acción

Desplegar una edge function temporal `admin-create-payment-order` que ejecute el RPC `create_payment_order_with_snapshot` con service role, pasando:

```
traveler_id: 2622016c-427d-4a97-89b0-eab611d96ae8
trip_id: 80f8400b-b527-4f1d-9c99-d1a86cd68c26
amount: 170
bank_name: Industrial
bank_account_holder: Alejandra De Leon
bank_account_number: 3707566
bank_account_type: ahorros
```

Esto creará la orden con snapshot histórico de los 2 paquetes entregados y marcará `payment_order_created = true` en el acumulador. Después de confirmar que se creó correctamente, eliminar la edge function temporal.

