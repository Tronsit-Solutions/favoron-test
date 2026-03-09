

## Duplicar pedido 7c3f3bf5 en estado "approved"

### Pedido original
- **ID**: `7c3f3bf5-9d96-4a27-acc9-817fdce38f61`
- **Descripción**: Pedido de 2 productos: Vermouth 1L, Gin
- **Estado actual**: `received_by_traveler`
- **Viaje asignado**: `e4a1ed15-ea94-4c08-9f34-5ffd66ab6168`
- **Usuario**: `5e3c944e-9130-4ea7-8165-b8ec9d5abf6f`

### Acción
Crear una edge function temporal `duplicate-package` que:

1. Copie el registro original conservando: `user_id`, `item_description`, `estimated_price`, `delivery_deadline`, `purchase_origin`, `package_destination`, `package_destination_country`, `delivery_method`, `products_data`, `matched_trip_id`, `matched_trip_dates`
2. Resetee campos de progreso: `quote`, `quote_expires_at`, `payment_receipt`, `purchase_confirmation`, `tracking_info`, `traveler_confirmation`, `office_delivery`, `traveler_address`, `confirmed_delivery_address`, `admin_assigned_tip`, `admin_actions_log`, `label_number`
3. Limpie metadatos de recepción en `products_data` (adminAssignedTip)
4. Establezca `status = 'approved'`
5. Genere nuevo `id`, timestamps frescos

### Implementación
- Edge function temporal con service role key
- Se invoca una vez via `curl_edge_functions`
- Se elimina después de ejecutar

