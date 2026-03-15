

## Crear orden de cobro faltante para Melanie Spencer

### Diagnóstico
- Trip `101c5277` (Fort Worth → Guatemala City) tiene 9 paquetes, de los cuales 4 fueron cancelados y 5 entregados.
- La orden de pago completada (`f9aa009d`, Q360) cubrió solo 4 paquetes.
- **Paquete faltante**: `287f9fcc` — "crema para el cuerpo, tamaño mini + perfume mini para el pelo" — status `delivered_to_office`, tip Q50. No fue incluido en el pago original.

### Acción
Insertar una nueva `payment_order` pendiente por **Q50** con:
- Mismos datos bancarios (Banco Promerica, cuenta 32996620151368, ahorros)
- `historical_packages` con snapshot del paquete `287f9fcc` y sus 2 productos
- Status `pending` para que el admin la procese

### SQL (migración)
```sql
INSERT INTO payment_orders (
  traveler_id, trip_id, amount,
  bank_name, bank_account_holder, bank_account_number, bank_account_type,
  status, payment_type, historical_packages
) VALUES (
  'a19a9275-7b82-496c-bc6e-32773033391a',
  '101c5277-b798-4ab6-a800-d2a62f14b8f9',
  50,
  'Banco Promerica', 'Melanie Spencer', '32996620151368', 'ahorros',
  'pending', 'trip_payment',
  '[{
    "package_id": "287f9fcc-fd4d-4da9-804d-5c447c1b83cc",
    "item_description": "Pedido de 2 productos: crema para el cuerpo, tamaño mini, perfume mini para el pelo",
    "admin_assigned_tip": 50,
    "status": "delivered_to_office",
    "quote": {"adminAssignedTipAccepted":true,"deliveryFee":0,"price":50,"serviceFee":25,"totalPrice":75},
    "products_data": [
      {"adminAssignedTip":25,"estimatedPrice":16,"itemDescription":"crema para el cuerpo, tamaño mini","quantity":1,"requestType":"online"},
      {"adminAssignedTip":25,"estimatedPrice":25,"itemDescription":"perfume mini para el pelo","quantity":1,"requestType":"online"}
    ]
  }]'::jsonb
);
```

