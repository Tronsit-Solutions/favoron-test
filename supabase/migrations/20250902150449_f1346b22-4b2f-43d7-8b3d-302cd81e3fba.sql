
-- 1) Remover CHECK constraints que afecten rejection_reason en packages y trips (si existieran)
DO $$
DECLARE 
  r RECORD;
BEGIN
  -- packages
  FOR r IN 
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'packages'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%rejection_reason%'
  LOOP
    EXECUTE format('ALTER TABLE public.packages DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- trips
  FOR r IN 
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'trips'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%rejection_reason%'
  LOOP
    EXECUTE format('ALTER TABLE public.trips DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 2) Asegurar tipos de columnas legacy
ALTER TABLE public.packages ALTER COLUMN rejection_reason TYPE text;
ALTER TABLE public.trips ALTER COLUMN rejection_reason TYPE text;

-- 3) Agregar nuevos campos por contexto
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS admin_rejection jsonb,
  ADD COLUMN IF NOT EXISTS quote_rejection jsonb,
  ADD COLUMN IF NOT EXISTS traveler_rejection jsonb;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS admin_rejection jsonb;

-- 4) Backfill básico

-- 4a) Admin backfill en packages: si status='rejected' y hay rejection_reason
UPDATE public.packages
SET admin_rejection = jsonb_build_object(
      'reason', rejection_reason,
      'rejected_at', updated_at
    )
WHERE admin_rejection IS NULL
  AND status = 'rejected'
  AND rejection_reason IS NOT NULL;

-- 4b) Quote backfill en packages: si status='quote_rejected' o hay datos de re-cotización
UPDATE public.packages
SET quote_rejection = jsonb_build_object(
      'reason', rejection_reason,
      'wants_requote', COALESCE(wants_requote, false),
      'additional_notes', additional_notes,
      'rejected_at', updated_at
    )
WHERE quote_rejection IS NULL
  AND (
    status = 'quote_rejected'
    OR wants_requote IS NOT NULL
    OR additional_notes IS NOT NULL
  );

-- 4c) Traveler backfill desde admin_actions_log cuando exista acción 'traveler_rejection'
WITH last_traveler_rej AS (
  SELECT
    p.id,
    -- tomar la última entrada traveler_rejection
    (SELECT elem
     FROM jsonb_array_elements(p.admin_actions_log) WITH ORDINALITY AS t(elem, ord)
     WHERE elem->>'action_type' = 'traveler_rejection'
     ORDER BY ord DESC
     LIMIT 1) AS entry
  FROM public.packages p
  WHERE p.admin_actions_log IS NOT NULL
)
UPDATE public.packages AS p
SET traveler_rejection = jsonb_build_object(
      'reason', (ltr.entry->'additional_data'->>'rejection_reason'),
      'wants_requote', COALESCE((ltr.entry->'additional_data'->>'wants_requote')::boolean, false),
      'additional_comments', ltr.entry->'additional_data'->>'additional_comments',
      'rejected_at', COALESCE((ltr.entry->>'timestamp')::timestamptz, p.updated_at)
    )
FROM last_traveler_rej ltr
WHERE p.id = ltr.id
  AND ltr.entry IS NOT NULL
  AND p.traveler_rejection IS NULL;

-- 5) Actualizar la función RPC para traveler rejections a llenar traveler_rejection además de legacy
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _wants_requote boolean DEFAULT false,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_traveler_id UUID;
  package_shopper_id UUID;
  package_item_description TEXT;
  admin_user_id UUID;
  cleaned_products jsonb;
BEGIN
  -- Verify that the current user is the assigned traveler
  SELECT t.user_id, p.user_id, p.item_description
  INTO package_traveler_id, package_shopper_id, package_item_description
  FROM public.packages p
  LEFT JOIN public.trips t ON t.id = p.matched_trip_id
  WHERE p.id = _package_id;
  
  IF package_traveler_id IS NULL OR package_traveler_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete o el paquete no existe';
  END IF;

  -- Build products_data without adminAssignedTip key (if exists)
  SELECT CASE 
           WHEN p.products_data IS NOT NULL 
                AND jsonb_typeof(p.products_data) = 'array' 
                AND jsonb_array_length(p.products_data) > 0
             THEN (
               SELECT jsonb_agg(elem - 'adminAssignedTip')
               FROM jsonb_array_elements(p.products_data) AS elem
             )
           ELSE p.products_data
         END
  INTO cleaned_products
  FROM public.packages p
  WHERE p.id = _package_id;

  -- Update the package with traveler rejection data, clear trip assignment and tips
  UPDATE public.packages
  SET 
    -- new contextual field
    traveler_rejection = jsonb_build_object(
      'reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'additional_comments', _additional_comments,
      'rejected_by', auth.uid(),
      'rejected_at', NOW()
    ),
    -- legacy fields for backward compatibility
    rejection_reason = _rejection_reason,
    wants_requote = _wants_requote,
    additional_notes = _additional_comments,
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    products_data = cleaned_products,
    status = 'approved', -- back to approved for reassignment
    updated_at = NOW()
  WHERE id = _package_id;

  -- Log admin action
  PERFORM log_admin_action(
    _package_id,
    package_traveler_id,
    'traveler_rejection',
    'Traveler rejected admin-assigned package',
    jsonb_build_object(
      'rejection_reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'additional_comments', _additional_comments
    )
  );

  -- Notify shopper about rejection
  PERFORM public.create_notification(
    package_shopper_id,
    '🔄 Paquete disponible para reasignación',
    CONCAT('El viajero ha rechazado la asignación para "', package_item_description, '". Favorón buscará otro viajero disponible.'),
    'package',
    'normal',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'change_type', 'traveler_rejection'
    )
  );

  -- Notify admins about rejection for reassignment
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete rechazado - Disponible para reasignación',
      CONCAT('El paquete "', package_item_description, '" fue rechazado por el viajero y está disponible para reasignación.'),
      'package',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', _package_id,
        'action_needed', 'reassign_package'
      )
    );
  END LOOP;
END;
$function$;
