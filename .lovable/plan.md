

## Timer de 24h para `bid_submitted` — ventana de decisión del shopper

### Problema
Cuando un viajero envía su cotización (`bid_pending` → `bid_submitted`), el trigger `set_assignment_bid_expiration` **borra** `expires_at`. Esto deja el assignment sin expiración, y el paquete queda atrapado en `matched` indefinidamente si el shopper nunca selecciona ganador.

### Solución

**1 migración SQL** con 3 cambios:

**A. Modificar trigger `set_assignment_bid_expiration`**

En lugar de borrar `expires_at` al pasar a `bid_submitted`, setear 24h desde ese momento:

```sql
-- Antes:
IF NEW.status = 'bid_submitted' AND OLD.status = 'bid_pending' THEN
  NEW.expires_at = NULL;  -- ❌ borra el timer

-- Después:
IF NEW.status = 'bid_submitted' AND OLD.status = 'bid_pending' THEN
  NEW.expires_at = NOW() + INTERVAL '24 hours';  -- ✅ 24h para que el shopper decida
```

**B. Ampliar `expire_unresponded_assignments()` — nuevo Step 2c**

Agregar un bloque que expire assignments en `bid_submitted` cuyo `expires_at < NOW()`:

```sql
-- Step 2c: Expire bid_submitted past shopper decision window
FOR assignment_record IN
  SELECT pa.id, pa.package_id, pa.trip_id, ...
  FROM package_assignments pa
  WHERE pa.status = 'bid_submitted'
    AND pa.expires_at IS NOT NULL
    AND pa.expires_at < NOW()
LOOP
  UPDATE package_assignments
  SET status = 'bid_expired', updated_at = NOW(), expires_at = NULL
  WHERE id = assignment_record.id;
  -- + notificación al viajero y al shopper
END LOOP;
```

La lógica existente de Step 2b ya se encarga de devolver el paquete a `approved` si todos los assignments terminan en estado terminal.

**C. Data fix retroactivo**

Setear `expires_at = NOW() + INTERVAL '24 hours'` para los assignments actualmente en `bid_submitted` sin expiración (los 18 que encontramos antes).

### Resultado

```text
bid_pending ──(24h)──→ bid_expired
bid_pending ──(viajero cotiza)──→ bid_submitted ──(24h)──→ bid_expired
                                                 ──(shopper elige)──→ bid_won ✅
```

Si todos los assignments expiran, el paquete vuelve automáticamente a `approved`.

### Archivos
- 1 migración SQL (trigger + función + data fix)

