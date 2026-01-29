

## Eliminar Notificación de Cotización Expirada al Shopper

### Objetivo
Eliminar completamente la notificación que se envía al shopper cuando su cotización expira, para reducir el spam de emails y evitar timeouts en la función.

### Cambio Requerido

Crear una nueva migración SQL que modifique la función `expire_old_quotes()` para **eliminar las líneas 56-69** que envían la notificación al shopper.

#### Código a Eliminar

```sql
-- ELIMINAR ESTE BLOQUE COMPLETO:
-- Create notification for shopper about expired quote
BEGIN
  PERFORM public.create_notification(
    package_record.user_id,
    'Cotización expirada',
    'Tu cotización ha expirado porque no se completó el pago a tiempo.',
    'quote',
    'normal',
    '/dashboard',
    jsonb_build_object('package_id', package_record.id)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create shopper notification for package %: %', package_record.id, SQLERRM;
END;
```

### Justificación

1. **El shopper ya sabe**: El UI ya muestra "Cotización expirada" cuando el usuario ve su paquete en el dashboard
2. **Reduce spam**: Elimina emails innecesarios que el usuario no necesita
3. **Mejora rendimiento**: Reduce 1 HTTP call por paquete expirado, evitando timeouts
4. **La información persiste**: El estado `quote_expired` en la base de datos es suficiente para informar al usuario

### Archivo a Crear

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/[timestamp]_remove_shopper_expiration_notification.sql` | Nueva migración |

### Nota sobre Notificación al Viajero

La notificación al viajero ("Asignación expirada") **se mantiene** por ahora, ya que es importante que el viajero sepa que el paquete fue removido de su lista. Si también deseas eliminarla, puedo incluirla en el mismo cambio.

