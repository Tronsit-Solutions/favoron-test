

## Desvinculer pedido de Luisa Torres del viaje de Leslie Lopez

### Situación actual
- **Paquete**: `b6118b13-a65a-439f-9545-8bd0668ec846` (3 blusas)
- **Status**: ya está en `approved`
- **Problema**: `matched_trip_id` sigue apuntando al trip de Leslie Lopez (`89e1781c-b1cd-459c-9b4e-80b321357bb5`)
- La assignment ya está en `bid_cancelled`

### Acción
Ejecutar un UPDATE para limpiar el `matched_trip_id` y campos relacionados al match anterior:

```sql
UPDATE packages
SET matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    updated_at = now()
WHERE id = 'b6118b13-a65a-439f-9545-8bd0668ec846';
```

Esto liberará el paquete para que aparezca en la pestaña de Solicitudes Pendientes y pueda ser asignado a un nuevo viajero.

### Detalles técnicos
- Se usa la herramienta de inserción/actualización de datos (no migración, ya que es un cambio de datos)
- No se requieren cambios de código ni de esquema

