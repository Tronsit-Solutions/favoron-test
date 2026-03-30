

## Expirar zombies `bid_submitted` → paquete a `quote_expired`

### Contexto
La migración anterior les dio 48h más de vida a los zombies. El usuario quiere expirarlos **ahora** y que los paquetes vayan a `quote_expired` (no `approved`) para que el shopper los recotice.

### Cambios

**1. Migración SQL — Modificar Step 2b de `expire_unresponded_assignments()`**

Cuando todos los assignments de un paquete expiran (remaining_active = 0), cambiar el estado del paquete de `approved` a `quote_expired`:

```sql
-- Línea 220 actual:
SET status = 'approved',

-- Cambiar a:
SET status = 'quote_expired',
```

Esto aplica para el futuro: cada vez que todos los viajeros asignados a un paquete expiren, el paquete irá a `quote_expired` en lugar de `approved`.

**2. Data fix inmediato (insert tool) — Expirar zombies ahora**

Dos operaciones:
- Marcar todos los `bid_submitted` zombie como `bid_expired`
- Actualizar los paquetes correspondientes (que no tengan assignments activos restantes) a `quote_expired`

```sql
-- A: Expirar assignments zombie
UPDATE package_assignments
SET status = 'bid_expired', expires_at = NULL, updated_at = NOW()
WHERE status = 'bid_submitted';

-- B: Mover paquetes sin assignments activos a quote_expired
UPDATE packages
SET status = 'quote_expired', matched_trip_id = NULL, updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT pa.package_id FROM package_assignments pa
  WHERE pa.status = 'bid_expired'
)
AND NOT EXISTS (
  SELECT 1 FROM package_assignments pa2
  WHERE pa2.package_id = packages.id
  AND pa2.status IN ('bid_pending', 'bid_submitted', 'bid_won')
)
AND status IN ('matched', 'quote_sent');
```

### Archivos
- 1 migración SQL (función `expire_unresponded_assignments` con `quote_expired`)
- 1 data fix via insert tool (expiración inmediata de zombies)

