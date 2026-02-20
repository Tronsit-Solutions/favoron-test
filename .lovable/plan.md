

## Actualizar paquetes archived_by_shopper

Ejecutar un UPDATE en la base de datos para marcar los 113 paquetes con status `archived_by_shopper` como `feedback_completed = true`, evitando que reaparezcan si se modifica la logica de filtrado en el futuro.

### Cambio

Una sola sentencia SQL:

```text
UPDATE packages 
SET feedback_completed = true 
WHERE status = 'archived_by_shopper' 
  AND feedback_completed = false;
```

### Detalles tecnicos

- No requiere migracion de esquema, es solo una actualizacion de datos
- Se ejecuta con el insert tool de Supabase
- Afecta unicamente los 113 registros identificados previamente
- No hay cambios en codigo frontend ni en politicas RLS

