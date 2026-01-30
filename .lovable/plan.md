
## Ajustes a Notificaciones por Email

### Análisis del Estado Actual

Revisé todas las funciones RPC y encontré lo siguiente:

| Notificación | Estado Actual | Acción Requerida |
|--------------|---------------|------------------|
| Cotización expirada (shopper) | ✅ Ya eliminada | Ninguna |
| Cotización expirada (traveler) | ❌ Envía con prioridad 'normal' | Eliminar |
| Paquete rechazado por viajero (shopper) | ✅ No envía | Ninguna |
| Paquete disponible para reasignación (shopper) | ✅ Ya eliminada | Ninguna |

---

### Sobre tus Preguntas

**Recordatorio de cotización pendiente (`send_quote_reminders`):**
- Se envía a los **shoppers** cuando su cotización está por expirar
- **36 horas antes**: Título "⏰ Recordatorio: Cotización por expirar" - prioridad `normal` (email solo si preferencia habilitada)
- **1-2 horas antes**: Título "🚨 ¡Última oportunidad para pagar!" - prioridad `urgent` (siempre envía email)

**Cambios de estado de paquetes:**
- **NO existe** notificación automática por email cuando un paquete cambia de estado
- Solo hay un `pg_notify` interno para análisis
- Las únicas notificaciones de estado son las manuales (ej: cuando admin envía cotización)

---

### Cambio a Realizar

**Archivo**: Nueva migración SQL

Actualizar `expire_old_quotes` para **eliminar** la notificación al viajero cuando una cotización expira:

```text
-- ANTES (líneas 38-52):
IF trip_record.user_id IS NOT NULL THEN
  BEGIN
    PERFORM public.create_notification(
      trip_record.user_id,
      'Asignación expirada',
      'Un paquete fue removido de tu lista...',
      'assignment',
      'normal',
      ...
    );
  EXCEPTION ...
  END;
END IF;

-- DESPUÉS:
-- (Eliminar este bloque completamente)
```

### Justificación

- El viajero no necesita saber que el shopper no pagó
- El paquete simplemente desaparece de su lista automáticamente (ya se limpia `matched_trip_id`)
- Reduce carga de notificaciones innecesarias

---

### Flujo Simplificado Resultante

```text
COTIZACIÓN EXPIRA
       │
       ├──► Shopper: Ve "Cotización expirada" en dashboard (sin email)
       │
       └──► Traveler: Paquete desaparece silenciosamente de su lista
```

---

### Sección Técnica

**Migración SQL**:
```sql
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  package_record RECORD;
BEGIN
  FOR package_record IN
    SELECT p.id, p.user_id, p.matched_trip_id, p.item_description
    FROM public.packages p
    WHERE p.status IN ('quote_sent', 'payment_pending')
      AND p.quote_expires_at IS NOT NULL
      AND p.quote_expires_at < NOW()
  LOOP
    -- Update package status and clear trip assignment
    UPDATE public.packages
    SET 
      status = 'quote_expired',
      matched_trip_id = NULL,
      traveler_address = NULL,
      matched_trip_dates = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;

    -- Traveler notification REMOVED
    -- Shopper notification already removed

    RAISE NOTICE 'Expired quote for package %', package_record.id;
  END LOOP;
END;
$$;
```

**Resultado**: Cuando una cotización expira:
- El paquete se desvincula del viaje silenciosamente
- Ni shopper ni traveler reciben email
- Ambos ven el cambio reflejado en sus dashboards
