

## Crear viaje de Madrid a Guatemala para Rodrigo Zibara

### Datos del viaje

| Campo | Valor |
|-------|-------|
| **Viajero** | Rodrigo Zibara (`73c1d68d-2afd-4e5f-b9fa-c812939c5dc2`) |
| **Ruta** | Madrid, España → Guatemala City, Guatemala |
| **Recepción de paquetes** | 10 de abril – 1 de mayo 2026 |
| **Llegada** | 3 de mayo 2026 |
| **Entrega** | 4 de mayo 2026 |
| **Espacio disponible** | 10 kg |
| **Dirección en Madrid** | Calle del General Pardiñas 108, 3D, 28006 Madrid, contacto +34 610614976 |
| **Status** | `pending_approval` |

### Acción

Insertar un registro en `trips` usando la herramienta de inserción de datos con este SQL:

```sql
INSERT INTO trips (
  user_id, from_city, from_country, to_city, to_country,
  first_day_packages, last_day_packages, arrival_date, delivery_date,
  package_receiving_address, available_space, status
) VALUES (
  '73c1d68d-2afd-4e5f-b9fa-c812939c5dc2',
  'Madrid', 'España',
  'Guatemala City', 'Guatemala',
  '2026-04-10 12:00:00+00', '2026-05-01 12:00:00+00',
  '2026-05-03 12:00:00+00', '2026-05-04 12:00:00+00',
  '{"accommodationType":"casa","cityArea":"Madrid","contactNumber":"+34610614976","hotelAirbnbName":"","postalCode":"28006","recipientName":"Rodrigo Zibara","streetAddress":"Calle del General Pardiñas 108","streetAddress2":"3D"}',
  10,
  'pending_approval'
);
```

No se requieren cambios de código ni de esquema.

