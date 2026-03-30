

## Limpieza de assignments stale — paquetes cancelados

### Hallazgo actual

| Assignment Status | Package Status | Cantidad | ¿Stale? |
|---|---|---|---|
| bid_submitted | cancelled | 3 | Sí |
| bid_won | pending_purchase | 5 | No (legítimo) |

Los paquetes `quote_expired` ya fueron limpiados en la migración anterior. Solo quedan **3 assignments en `bid_submitted` para paquetes `cancelled`** que necesitan corregirse.

### Cambios

**1. Data cleanup — cancelar las 3 assignments stale restantes**

Ejecutar via insert tool:
```sql
UPDATE public.package_assignments
SET status = 'bid_cancelled', updated_at = NOW()
WHERE status IN ('bid_submitted', 'bid_pending', 'bid_won')
  AND package_id IN (
    SELECT id FROM public.packages
    WHERE status IN ('cancelled', 'rejected', 'deadline_expired', 'quote_expired', 'quote_rejected')
      AND matched_trip_id IS NULL
  );
```

**2. Prevención futura — actualizar lógica de cancelación de paquetes**

Buscar en el código dónde se cancela un paquete (probablemente un handler que hace `UPDATE packages SET status = 'cancelled'`) y agregar la cancelación automática de `package_assignments` activos, igual que se hizo con `expire_old_quotes()`.

### Archivos a revisar
- Handlers de cancelación de paquetes en el frontend (buscar `cancelled` en updates a packages)
- Data fix via insert tool para las 3 assignments existentes

