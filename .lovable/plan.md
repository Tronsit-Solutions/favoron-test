

## Duplicar orden 0ac04ea5 y asignarla a Anika Erichsen

### Datos encontrados

- **Orden original**: `0ac04ea5` - "Es el whoop (chip y banda)" - Shopper: `97ed320e` - Status: `received_by_traveler` - Viajero actual: trip `662b8f5b`
- **Anika Erichsen**: profile `42ff1de3`, email `anika.erichsen@icloud.com` - Trip aprobado `573209c2` (Miami -> Guatemala City, llega 2026-03-05, entrega 2026-03-06)

### Plan

**Crear edge function temporal `duplicate-package`** que:

1. Verifique que el caller es admin (via service role + user_roles check)
2. Lea el paquete original `0ac04ea5`
3. Inserte un nuevo paquete con:
   - Mismo `user_id` (shopper original: `97ed320e`)
   - Mismo `item_description`, `estimated_price`, `purchase_origin`, `package_destination`, `delivery_method`, `item_link`
   - `products_data` limpio (sin metadata de recepcion/confirmacion)
   - `matched_trip_id` = `573209c2` (trip de Anika)
   - `status` = `matched`
   - `delivery_deadline` = 2026-03-07 (dia despues de la entrega de Anika)
   - Sin `quote`, `payment_receipt`, `purchase_confirmation`, `tracking_info`, `traveler_confirmation`, `office_delivery`
   - `admin_actions_log` con entrada de "duplicado desde 0ac04ea5, asignado a Anika Erichsen"
4. Retorne el ID del nuevo paquete

**Desplegar, ejecutar, y luego eliminar** la edge function.

### Archivos
- `supabase/functions/duplicate-package/index.ts` — Edge function temporal

