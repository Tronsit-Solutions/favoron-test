
-- 1) Migrar registros con status = 'archived_by_shopper' a 'completed' o 'cancelled'
WITH to_update AS (
  SELECT 
    id,
    CASE
      WHEN (office_delivery IS NOT NULL AND (office_delivery ? 'admin_confirmation'))
        OR ((traveler_confirmation->>'confirmed_at') IS NOT NULL)
      THEN 'completed'
      ELSE 'cancelled'
    END AS new_status
  FROM public.packages
  WHERE status = 'archived_by_shopper'
)
UPDATE public.packages p
SET 
  status = u.new_status,
  updated_at = now(),
  admin_actions_log = COALESCE(p.admin_actions_log, '[]'::jsonb) || jsonb_build_object(
    'timestamp', now(),
    'action_type', 'archived_status_migrated',
    'description', 'Migrated from archived_by_shopper',
    'additional_data', jsonb_build_object('from_status', 'archived_by_shopper', 'to_status', u.new_status)
  )
FROM to_update u
WHERE p.id = u.id;

-- 2) Quitar la restricción CHECK existente del status y recrearla sin 'archived_by_shopper'
-- Nota: el nombre puede variar; primero intentamos el nombre común y, si no existe, lo buscamos dinámicamente.
ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_status_check;

DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname
    INTO c_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = 'packages'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND conname ILIKE '%status%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.packages DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

-- 3) Crear una restricción CHECK actualizada con todos los estados de paquete usados por la app, sin 'archived_by_shopper'
ALTER TABLE public.packages
ADD CONSTRAINT packages_status_check
CHECK (
  status IN (
    'pending_approval',
    'approved',
    'rejected',
    'matched',
    'quote_sent',
    'quote_rejected',
    'quote_expired',
    'quote_accepted',
    'payment_pending',
    'payment_pending_approval',
    'payment_confirmed',
    'paid',
    'pending_purchase',
    'purchased',
    'shipped',
    'in_transit',
    'received_by_traveler',
    'pending_office_confirmation',
    'delivered_to_office',
    'delivered',
    'completed',
    'cancelled',
    'address_confirmed'
  )
);
