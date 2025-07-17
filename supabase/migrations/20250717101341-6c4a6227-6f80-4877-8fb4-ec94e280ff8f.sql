-- Add support for admin troubleshooting tools
ALTER TABLE public.packages 
ADD COLUMN incident_flag boolean DEFAULT false,
ADD COLUMN internal_notes text,
ADD COLUMN admin_actions_log jsonb DEFAULT '[]'::jsonb;

-- Add index for better search performance
CREATE INDEX idx_packages_incident_flag ON public.packages(incident_flag) WHERE incident_flag = true;
CREATE INDEX idx_packages_item_description_search ON public.packages USING gin(to_tsvector('spanish', item_description));
CREATE INDEX idx_packages_additional_notes_search ON public.packages USING gin(to_tsvector('spanish', additional_notes));

-- Add support for user profiles search
CREATE INDEX idx_profiles_search ON public.profiles USING gin(
  to_tsvector('spanish', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone_number, ''))
);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _package_id uuid,
  _admin_id uuid,
  _action_type text,
  _action_description text,
  _additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.packages
  SET admin_actions_log = admin_actions_log || jsonb_build_object(
    'timestamp', NOW(),
    'admin_id', _admin_id,
    'action_type', _action_type,
    'description', _action_description,
    'additional_data', _additional_data
  )
  WHERE id = _package_id;
END;
$$;