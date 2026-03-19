

## Mover paquete de Benjamin Carrillo a "approved"

### Estado actual
- **Paquete**: `a78db663-8380-45f2-838b-78b182e7080b` ("Set de pines esmaltados")
- **Status actual**: `matched`
- **matched_trip_id**: ya es `NULL` (no tiene viaje asignado)
- **admin_assigned_tip**: 70.00

### Acción
Ejecutar un UPDATE directo en la base de datos:
```sql
UPDATE packages 
SET status = 'approved', 
    admin_assigned_tip = NULL,
    updated_at = now()
WHERE id = 'a78db663-8380-45f2-838b-78b182e7080b';
```

Esto cambia el status a `approved` y limpia el tip asignado previamente, ya que al no tener match activo no aplica.

