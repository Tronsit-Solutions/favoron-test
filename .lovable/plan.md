

## Plan: Duplicar orden 37f07d91 sin viajero, estatus approved

### Datos del paquete original
- **ID**: `37f07d91-c7be-472e-a82d-191ebba5b0a8`
- **Usuario**: `e35160f9-0cb0-45ce-987d-32431caaf986`
- **Productos**: Carregador de Bateria ($17.99) + Juego de mesa chico ($11.99)
- **Estado actual**: `in_transit` con viajero asignado (`b35ab649`)

### Pasos

#### 1. Crear Edge Function temporal `temp-duplicate-37f07d91`
Insertar un nuevo registro en `packages` con:
- Todos los campos del producto copiados (products_data, item_description, estimated_price, purchase_origin, package_destination, delivery_method, admin_assigned_tip, payment_method)
- **status**: `approved`
- **matched_trip_id**: `null` (sin viajero)
- Campos de viajero en null: traveler_address, matched_trip_dates, traveler_confirmation, etc.
- Campos de pago/tracking en null: quote, payment_receipt, purchase_confirmation, tracking_info
- **internal_notes**: "Duplicado de orden 37f07d91 sin viajero asignado"

#### 2. Ejecutar y verificar
Invocar la función, confirmar que se creó el nuevo paquete con ID y status `approved`.

#### 3. Eliminar la Edge Function temporal
Borrar `supabase/functions/temp-duplicate-37f07d91/` después de ejecutar.

