
-- Add incident_status column to packages
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS incident_status text,
  ADD COLUMN IF NOT EXISTS incident_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: existing packages with incident_flag=true get incident_status='active'
UPDATE public.packages
SET incident_status = 'active'
WHERE incident_flag = true AND incident_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.packages.incident_status IS 'Incident status: active, resolved, or null (no incident)';
COMMENT ON COLUMN public.packages.incident_history IS 'Array of incident events: {action, timestamp, admin_id, admin_name, reason, resolution_notes}';
