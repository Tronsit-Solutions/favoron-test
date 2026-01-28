

# Plan: Simplificar Expiración de Cotizaciones con Log Histórico

## Resumen del Problema

1. **Actual**: Cuando una cotización expira, el paquete se queda "atrapado" en el dashboard del viajero
2. **Workaround actual**: Viajero debe descartar manualmente, lo cual setea `traveler_dismissed_at` y causa bugs al reasignar
3. **Falta**: Log histórico confiable de asignaciones

## Solución Propuesta

### Cambio 1: Actualizar `expire_old_quotes` (Migración SQL)

La función debe:
- Mantener status `quote_expired` (NO volver a `approved`)
- Limpiar campos del viajero automáticamente
- Guardar log histórico en `admin_actions_log`

```sql
CREATE OR REPLACE FUNCTION public.expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_record RECORD;
  prev_trip_id UUID;
  traveler_user_id UUID;
BEGIN
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id, p.status,
           t.user_id as trip_user_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE (p.status = 'quote_sent' OR p.status = 'payment_pending')
      AND p.quote_expires_at IS NOT NULL 
      AND p.quote_expires_at < NOW()
  LOOP
    prev_trip_id := package_record.matched_trip_id;
    traveler_user_id := package_record.trip_user_id;

    -- Actualizar paquete: status expired + limpiar campos viajero
    UPDATE public.packages 
    SET 
      status = 'quote_expired',
      quote = NULL,
      matched_trip_id = NULL,           -- Limpia para que no aparezca en dashboard viajero
      traveler_address = NULL,
      matched_trip_dates = NULL,
      quote_expires_at = NULL,
      matched_assignment_expires_at = NULL,
      admin_assigned_tip = NULL,
      updated_at = NOW()
      -- NO tocamos traveler_dismissed_at
    WHERE id = package_record.id;
    
    -- Log histórico con previous_trip_id
    PERFORM public.log_admin_action(
      package_record.id,
      NULL,
      'quote_expired_auto_cleanup',
      'Quote expired - traveler fields auto-cleaned',
      jsonb_build_object(
        'previous_trip_id', prev_trip_id,
        'previous_traveler_id', traveler_user_id,
        'previous_status', package_record.status,
        'reason', 'shopper_did_not_pay'
      )
    );
    
    -- Notificaciones (mantener existentes)
    -- ... (notificar a shopper y viajero)
  END LOOP;
END;
$function$;
```

### Cambio 2: Eliminar filtro `traveler_dismissed_at` del Dashboard

**Archivo**: `src/components/Dashboard.tsx`

Ya no es necesario filtrar por este campo porque:
- Si el paquete está asignado (`matched_trip_id` existe), se muestra
- Si se limpió (`matched_trip_id = NULL`), no aparece

```typescript
// ELIMINAR estas líneas (273-276):
if (pkg.traveler_dismissed_at) {
  return false;
}
```

### Cambio 3: Revertir workaround en `useDashboardActions.tsx`

**Archivo**: `src/hooks/useDashboardActions.tsx`

Eliminar las líneas que limpian `traveler_dismissed_at` al asignar (ya no necesario):

```typescript
// ELIMINAR de updateData (líneas 921-922):
traveler_dismissed_at: null,
traveler_dismissal: null
```

### Cambio 4: Revertir workaround en `AdminDashboard.tsx`

**Archivo**: `src/components/AdminDashboard.tsx`

Eliminar la limpieza optimista de dismissal:

```typescript
// ELIMINAR del objeto de actualización optimista (líneas 244-245):
traveler_dismissed_at: null,
traveler_dismissal: null
```

### Cambio 5: Simplificar `traveler_dismiss_package` (Opcional)

Esta función se vuelve menos necesaria pero puede mantenerse para casos edge. Sin embargo, debe:
- NO setear `traveler_dismissed_at`
- Solo guardar log en `traveler_dismissal` JSONB para historial

```sql
UPDATE public.packages
SET 
  traveler_dismissal = jsonb_build_object(
    'dismissed_at', now(),
    'dismissed_by', v_user_id,
    'previous_trip_id', v_trip_id
  ),
  -- NO setear traveler_dismissed_at
  matched_trip_id = NULL,
  -- ... resto de campos
WHERE id = _package_id;
```

## Flujo Resultante

```text
ANTES (problemático):
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐    ┌──────────────┐
│ quote_sent  │ -> │ quote_expired │ -> │ Viajero debe    │ -> │ dismissed_at │
│ trip_id=X   │    │ trip_id=X     │    │ descartar       │    │ set (BUG!)   │
└─────────────┘    └───────────────┘    └─────────────────┘    └──────────────┘

DESPUÉS (limpio):
┌─────────────┐    ┌───────────────────────────────────┐
│ quote_sent  │ -> │ quote_expired                     │
│ trip_id=X   │    │ trip_id=NULL (auto-cleaned)       │
│             │    │ admin_actions_log += history      │
└─────────────┘    └───────────────────────────────────┘
```

## Log Histórico de Asignaciones

Para consultar qué paquetes estuvieron asignados a un viajero:

```sql
-- Paquetes expirados que estuvieron asignados a un viajero específico
SELECT p.id, p.item_description,
       log->>'previous_trip_id' as trip_id,
       log->>'previous_traveler_id' as traveler_id,
       log->>'timestamp' as expired_at
FROM packages p,
     jsonb_array_elements(p.admin_actions_log) as log
WHERE log->>'action_type' = 'quote_expired_auto_cleanup'
  AND log->>'previous_traveler_id' = 'traveler-uuid';

-- Paquetes rechazados por un viajero
SELECT id, item_description, 
       traveler_rejection->>'previous_trip_id' as trip_id,
       traveler_rejection->>'rejected_at' as rejected_at
FROM packages
WHERE traveler_rejection->>'rejected_by' = 'traveler-uuid';
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Actualizar `expire_old_quotes` para auto-limpiar campos viajero |
| `src/components/Dashboard.tsx` | Eliminar filtro `traveler_dismissed_at` |
| `src/hooks/useDashboardActions.tsx` | Revertir limpieza de dismissal al asignar |
| `src/components/AdminDashboard.tsx` | Revertir limpieza optimista de dismissal |
| Migración SQL (opcional) | Simplificar `traveler_dismiss_package` |

## Beneficios

1. **Sin paquetes atrapados**: Se limpian automáticamente al expirar
2. **Sin intervención manual**: Viajero no tiene que hacer nada
3. **Sin bugs de reasignación**: No dependemos de `traveler_dismissed_at`
4. **Historial preservado**: Log en `admin_actions_log` con `previous_trip_id` y `previous_traveler_id`
5. **Status correcto**: Shopper ve `quote_expired` (sabe que expiró por no pagar)

## Nota sobre Columna `traveler_dismissed_at`

Después de implementar estos cambios, la columna `traveler_dismissed_at` se vuelve obsoleta. Se puede deprecar y eventualmente eliminar en una migración futura, pero esto no es urgente.

