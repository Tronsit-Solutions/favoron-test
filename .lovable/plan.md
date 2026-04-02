

## Fix de Seguridad: Eliminar Lectura Pública del Bucket `purchase-confirmations`

### Problema
La política **"Public read purchase confirmations"** permite a cualquier usuario (incluso anónimos) leer todos los archivos del bucket. Solo tiene `bucket_id = 'purchase-confirmations'` como condición, sin verificar `auth.uid()`.

### Solución
Una migración SQL con un solo statement:

```sql
DROP POLICY IF EXISTS "Public read purchase confirmations" ON storage.objects;
```

Ya existe una política **"Restricted access to purchase confirmations"** (creada en migración `20250828201303`) que correctamente restringe el acceso SELECT a:
- El dueño del paquete (shopper)
- El viajero emparejado
- Personal con rol de operaciones/admin

No se necesita crear una política nueva ni cambios en el frontend. Solo eliminar la política insegura.

### Verificación Post-Fix
- Los shoppers seguirán pudiendo ver sus propias confirmaciones de compra
- Los viajeros emparejados mantienen acceso
- Admins/operaciones mantienen acceso completo
- Usuarios no autorizados y anónimos quedan bloqueados

