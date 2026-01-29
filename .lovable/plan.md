
# Plan: Limpiar parámetro wants_requote de traveler_reject_assignment

## Problema

La función RPC `traveler_reject_assignment` tiene un parámetro `_wants_requote` que:
1. **No aplica al flujo del viajero** - `wants_requote` es una decisión del comprador, no del viajero
2. **El frontend no lo envía** - La llamada en `useDashboardActions.tsx` solo pasa `_package_id`, `_rejection_reason` y `_additional_comments`
3. **Puede sobrescribir datos incorrectamente** - Si la función tiene un valor por defecto, podría estar reseteando el campo `wants_requote` que el comprador configuró previamente

## Solución

Modificar la función RPC para eliminar el parámetro `_wants_requote` y asegurar que no modifique la columna `wants_requote` del paquete.

## Cambio de base de datos (migración SQL)

```sql
-- Drop the existing function
DROP FUNCTION IF EXISTS public.traveler_reject_assignment(uuid, text, text, boolean);

-- Recreate without _wants_requote parameter
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- NOTE: wants_requote is NOT modified - it's a shopper decision, not traveler
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.traveler_reject_assignment(uuid, text, text) 
TO authenticated;
```

## Resultado

| Campo | Antes | Después |
|-------|-------|---------|
| `_wants_requote` parámetro | Presente (no usado) | Eliminado |
| columna `wants_requote` | Podía ser sobrescrita | No se modifica |
| Datos del comprador | Riesgo de pérdida | Preservados |

## Impacto

- **Frontend**: No requiere cambios - ya no envía ese parámetro
- **Types.ts**: Se actualizará automáticamente cuando Supabase regenere los tipos
- **Flujo del viajero**: Funciona igual, sin efectos secundarios
