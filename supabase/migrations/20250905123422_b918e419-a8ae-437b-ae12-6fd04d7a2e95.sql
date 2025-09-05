-- Secure trips_with_user by dropping dependencies and recreating with proper access control

-- First drop the function that depends on the view
DROP FUNCTION IF EXISTS public.get_admin_trips_with_user() CASCADE;

-- Now drop the view
DROP VIEW IF EXISTS public.trips_with_user CASCADE;

-- Create a secure admin-only function to replace the view functionality
CREATE OR REPLACE FUNCTION public.get_admin_trips_with_user()
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  from_city text,
  to_city text,
  from_country text,
  departure_date timestamptz,
  arrival_date timestamptz,
  first_day_packages timestamptz,
  last_day_packages timestamptz,
  delivery_date timestamptz,
  package_receiving_address jsonb,
  available_space numeric,
  delivery_method text,
  messenger_pickup_info jsonb,
  status text,
  -- User info fields (sensitive data)
  username text,
  email text,
  first_name text,
  last_name text,
  phone_number text,
  user_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict admin-only access check
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required to view trips with user data';
  END IF;

  -- Return trips with user data only for admins
  RETURN QUERY
  SELECT 
    t.id,
    t.created_at,
    t.updated_at,
    t.user_id,
    t.from_city,
    t.to_city,
    t.from_country,
    t.departure_date,
    t.arrival_date,
    t.first_day_packages,
    t.last_day_packages,
    t.delivery_date,
    t.package_receiving_address,
    t.available_space,
    t.delivery_method,
    t.messenger_pickup_info,
    t.status,
    -- User profile data (now protected)
    p.username,
    p.email,
    p.first_name,
    p.last_name,
    p.phone_number,
    CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as user_display_name
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.arrival_date ASC;
END;
$$;

-- Grant execute permission only to authenticated users (function will enforce admin check)
GRANT EXECUTE ON FUNCTION public.get_admin_trips_with_user() TO authenticated;

-- Ensure no public access remains
REVOKE ALL ON FUNCTION public.get_admin_trips_with_user() FROM PUBLIC, anon;