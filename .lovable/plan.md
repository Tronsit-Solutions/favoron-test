

## Plan: Paquetes sin cotización deben volver a "approved", no "quote_expired"

### Problema

Cuando todos los viajeros asignados a un paquete dejan expirar su ventana de 24h **sin enviar cotización** (todos terminan en `bid_expired` sin haber pasado por `bid_submitted`), el paquete se marca como `quote_expired`. Esto es incorrecto porque nunca existió una cotización — el paquete debería regresar a `approved` para que el admin lo reasigne a otros viajeros.

**`quote_expired`** solo debe aplicarse cuando al menos un viajero **sí envió cotización** pero el shopper no la aceptó a tiempo.

### Cambio

Modificar la función `expire_unresponded_assignments()` en **Step 2b** (la sección que evalúa paquetes con todas las asignaciones terminales).

**Lógica actual (líneas 199-205):**
Siempre pone `status = 'quote_expired'`.

**Lógica nueva:**
1. Contar cuántas asignaciones terminaron con `bid_submitted` → `bid_expired` (es decir, el viajero sí cotizó pero el shopper no respondió).
2. Si **ningún viajero envió cotización** (todos fueron `bid_expired` desde `bid_pending`, o `bid_cancelled`): → `status = 'approved'` (listo para reasignar).
3. Si **al menos un viajero envió cotización** pero expiró sin respuesta del shopper: → `status = 'quote_expired'` (como ahora).

### Implementación

**Un solo archivo:** migración SQL que reemplaza `expire_unresponded_assignments()`.

Cambio clave en Step 2b:

```text
-- Antes:
IF remaining_active = 0 THEN
  UPDATE packages SET status = 'quote_expired' ...

-- Después:
IF remaining_active = 0 THEN
  -- Check if any traveler actually submitted a quote
  SELECT COUNT(*) INTO submitted_count
  FROM package_assignments pa
  WHERE pa.package_id = package_record.id
    AND pa.status = 'bid_expired'
    AND pa.quote IS NOT NULL;  -- had a quote = traveler submitted

  IF submitted_count > 0 THEN
    -- Shopper didn't respond → quote_expired
    UPDATE packages SET status = 'quote_expired' ...
  ELSE
    -- No traveler ever quoted → back to approved for reassignment
    UPDATE packages SET status = 'approved' ...
  END IF;
```

Las notificaciones se ajustan acorde:
- **→ approved**: notificar admins "paquete disponible para reasignación" (ningún viajero cotizó)
- **→ quote_expired**: mantener notificación actual (shopper no respondió a cotizaciones)

### Corrección del paquete Puma

La migración también incluirá un fix puntual para corregir el paquete `8532da77` (Puma Softride Escalate) de `quote_expired` → `approved`, ya que sus viajeros nunca enviaron cotización.

