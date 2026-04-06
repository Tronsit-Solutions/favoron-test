

## Diagnóstico: Paquete de Valeria en "Aprobado" con bid activo

### El problema

El paquete `3d6eff9d` de Valeria Andreatta tiene:
- **Status del paquete**: `approved` 
- **Asignación 1**: `bid_expired` (viaje `a906e...`)
- **Asignación 2**: `bid_submitted` (viaje `4e9a2...`) — **activa**

El paquete debería estar en estado `matched` (o `quote_sent`), no `approved`, porque tiene un bid activo.

### Causa raíz

La función `expire_old_quotes` (en la migración `20260330103652`) tiene un **Step 1** que resetea paquetes con `matched_assignment_expires_at` expirado:

```sql
-- Step 1: Packages with direct matched_trip_id expiration
WHERE p.status = 'matched' 
  AND p.matched_assignment_expires_at < NOW()
→ SET status = 'approved', matched_trip_id = NULL
```

Este paso **no verifica** si hay otras asignaciones activas (`bid_pending` o `bid_submitted`) antes de resetear a `approved`. Cuando el primer bid expiró, la función reseteó el paquete a `approved` sin considerar que el segundo viajero ya había enviado su cotización.

El **Step 2b** (líneas 172-200) sí verifica `remaining_active`, pero solo para paquetes que entran por la ruta de `bid_expired` individual — no para los que ya fueron reseteados en Step 1.

### Solución

Crear una migración SQL que:

1. **Corrija el dato**: Actualizar el paquete de Valeria a `matched` (o el estado correcto dado que tiene un `bid_submitted`).

2. **Arregle la lógica de expiración**: Modificar el Step 1 de `expire_old_quotes` para que antes de resetear un paquete a `approved`, verifique si existen otras asignaciones activas:

```sql
-- Solo resetear si NO hay asignaciones activas restantes
AND NOT EXISTS (
  SELECT 1 FROM public.package_assignments pa
  WHERE pa.package_id = p.id
  AND pa.status IN ('bid_pending', 'bid_submitted', 'bid_won')
)
```

3. **Agregar verificación general**: Añadir un paso final que detecte paquetes en `approved` que tengan asignaciones activas y los corrija automáticamente.

### Archivos a crear/modificar
- Nueva migración SQL para corregir `expire_old_quotes` y el dato de Valeria

### Resultado esperado
- El paquete de Valeria se corrige inmediatamente a estado `matched`
- La función `expire_old_quotes` ya no reseteará paquetes que aún tengan bids activos

