

## Crear viaje falso + paquete completado para testear rating

Usaré otro usuario como viajero (Glenda Diaz, `773bfe46...`) y te asignaré como shopper. Insertaré primero un viaje aprobado falso y luego un paquete `completed` con `feedback_completed = false` para que te aparezca el botón de calificar.

### Datos a insertar

**1. Trip falso** (viajero: Glenda Diaz)
- Ruta: Miami → Guatemala City
- Status: `approved`
- Fechas futuras genéricas

**2. Package completado** (shopper: tú, admin)
- Asignado al trip falso
- Status: `completed`
- `feedback_completed: false`
- Producto: "AirPods Pro 2 - TEST RATING"

### SQL a ejecutar (vía insert tool)

```sql
-- 1. Trip falso
INSERT INTO trips (
  user_id, from_city, to_city, from_country, to_country,
  status, arrival_date, first_day_packages, last_day_packages,
  delivery_date, delivery_method, package_receiving_address
) VALUES (
  '773bfe46-c746-4bba-a1e5-8694b5da4217',
  'Miami', 'Guatemala City', 'Estados Unidos', 'Guatemala',
  'approved',
  now() + interval '10 days',
  now() + interval '1 day',
  now() + interval '8 days',
  now() + interval '12 days',
  'oficina',
  '{"address": "Test Address", "city": "Miami"}'
) RETURNING id;

-- 2. Package completado (usando el trip_id del paso anterior)
INSERT INTO packages (
  user_id, item_description, estimated_price, delivery_deadline,
  matched_trip_id, status, purchase_origin, package_destination,
  delivery_method, feedback_completed, quote, products_data,
  additional_notes
) VALUES (
  '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f',
  'AirPods Pro 2 - TEST RATING', 249,
  now() + interval '30 days',
  '<trip_id_del_paso_1>',
  'completed', 'Estados Unidos', 'Guatemala',
  'pickup', false,
  '{"service_fee": 100, "delivery_fee": 25, "total": 374}',
  '[{"itemDescription": "AirPods Pro 2", "estimatedPrice": "249", "quantity": "1", "requestType": "online"}]',
  'Paquete falso para testear rating de viajero'
);
```

### Resultado esperado
Al abrir tu dashboard en la pestaña "Mis Pedidos", verás el paquete completado con el botón amarillo "Calificar viajero" que abre el flujo secuencial de rating (viajero → plataforma).

