

## Duplicar orden #b0ecfbe2 asignada al mismo viajero

### Datos del paquete original
- **Shopper**: be6953c9 (crema + perfume mini de Sephora)
- **Viaje asignado**: 101c5277 (Melanie Spencer)
- **Precio estimado**: Q41, Quote total: Q75 (tip Q50, service fee Q25, delivery Q0)
- **Estado actual**: `received_by_traveler`

### Plan

Crear una copia del paquete usando el insert tool con los datos esenciales del original, pero **limpiando** los campos de progreso (payment_receipt, purchase_confirmation, tracking_info, traveler_confirmation, products_data receipts, etc.) para que el nuevo paquete arranque como un pedido fresco.

**Campos que se copian tal cual:**
- `user_id`, `item_description`, `estimated_price`, `products_data` (sin campos de recepción), `item_link`, `purchase_origin`, `package_destination`, `package_destination_country`, `delivery_method`, `delivery_deadline`, `matched_trip_id`, `matched_trip_dates`, `traveler_address`, `admin_assigned_tip`, `quote`, `payment_method`

**Campos que se resetean:**
- `status` → `matched` (ya asignado al viajero)
- `payment_receipt` → null
- `purchase_confirmation` → null
- `tracking_info` → null
- `traveler_confirmation` → null
- `admin_actions_log` → entrada indicando que es duplicado del original
- `products_data[].receivedByTraveler` → removido
- `products_data[].receivedAt` → removido
- `products_data[].receivedPhoto` → removido

**Un solo cambio**: INSERT via insert tool, sin modificaciones de código ni migraciones.

