
# Plan: Registrar historial de viajeros que rechazaron paquetes

## Problema
Cuando un viajero rechaza un paquete, el `matched_trip_id` se limpia y actualmente no hay forma de saber qué viajeros rechazaron ese paquete anteriormente. El campo `traveler_rejection` guarda el `previous_trip_id` pero **se sobrescribe** con cada nuevo rechazo.

## Solución
Modificar la función RPC `traveler_reject_assignment` para que también agregue una entrada en `admin_actions_log` con la información completa del rechazo, incluyendo el `previous_trip_id` y `previous_traveler_id`.

## Cambio en Base de Datos

### Actualizar función `traveler_reject_assignment`

Agregar al final del UPDATE (antes del WHERE), la actualización del `admin_actions_log`:

```sql
admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_object(
  'timestamp', NOW(),
  'admin_id', _current_user_id,
  'action_type', 'traveler_rejection',
  'description', 'Traveler rejected admin-assigned package',
  'additional_data', jsonb_build_object(
    'rejection_reason', _rejection_reason,
    'additional_comments', _additional_comments,
    'previous_trip_id', _package_record.matched_trip_id,
    'previous_traveler_id', _current_user_id
  )
)
```

## Resultado
Con este cambio, cada vez que un viajero rechace un paquete:
1. Se registrará en `admin_actions_log` con `action_type: 'traveler_rejection'`
2. Incluirá `previous_trip_id` y `previous_traveler_id` en `additional_data`
3. Podrás consultar el historial completo de rechazos desde la UI de admin

## Consulta de ejemplo para ver historial de rechazos
```sql
SELECT id, item_description,
       jsonb_array_elements(admin_actions_log) as rejection_log
FROM packages 
WHERE admin_actions_log @> '[{"action_type": "traveler_rejection"}]';
```

## Mejora adicional en UI (opcional)
Agregar al modal de match de solicitud un indicador visual si el paquete tiene historial de rechazos previos, mostrando qué viajeros lo rechazaron y por qué.

---

## Detalle Técnico

**Migración SQL completa:**

```sql
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _current_user_id uuid := auth.uid();
  _package_record RECORD;
  _trip_record RECORD;
BEGIN
  -- Verify authenticated user
  IF _current_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Get package and verify it belongs to user's matched trip
  SELECT p.*, t.user_id as trip_owner_id, t.id as trip_id
  INTO _package_record
  FROM packages p
  JOIN trips t ON t.id = p.matched_trip_id
  WHERE p.id = _package_id
    AND t.user_id = _current_user_id
    AND p.status = 'matched';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete o no está en estado matched';
  END IF;

  -- Store trip info before clearing
  SELECT * INTO _trip_record FROM trips WHERE id = _package_record.matched_trip_id;

  -- Update package: reset to approved, clear match data, save rejection info
  UPDATE packages
  SET
    status = 'approved',
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    rejection_reason = _rejection_reason,
    internal_notes = CASE 
      WHEN _additional_comments IS NOT NULL THEN 
        COALESCE(internal_notes, '') || E'\n[Traveler Rejection] ' || _additional_comments
      ELSE internal_notes
    END,
    traveler_rejection = jsonb_build_object(
      'rejected_at', NOW(),
      'rejection_reason', _rejection_reason,
      'additional_comments', _additional_comments,
      'previous_trip_id', _package_record.matched_trip_id,
      'previous_traveler_id', _current_user_id
    ),
    -- NUEVO: Agregar al historial de acciones
    admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_object(
      'timestamp', NOW(),
      'admin_id', _current_user_id,
      'action_type', 'traveler_rejection',
      'description', 'Traveler rejected admin-assigned package',
      'additional_data', jsonb_build_object(
        'rejection_reason', _rejection_reason,
        'additional_comments', _additional_comments,
        'previous_trip_id', _package_record.matched_trip_id,
        'previous_traveler_id', _current_user_id
      )
    ),
    -- Clean product-level tips from products_data
    products_data = (
      SELECT jsonb_agg(
        product - 'adminAssignedTip'
      )
      FROM jsonb_array_elements(COALESCE(products_data, '[]'::jsonb)) AS product
    ),
    updated_at = NOW()
  WHERE id = _package_id;
END;
$function$;
```

**Beneficios:**
- Historial completo e inmutable de todos los rechazos
- Cada entrada incluye: timestamp, traveler_id, trip_id, razón del rechazo
- Compatible con el sistema actual de logs
- No se pierde información al reasignar el paquete a otro viajero
