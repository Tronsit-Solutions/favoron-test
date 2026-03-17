
-- Update traveler_has_active_assignment to include 'rejected' assignments
-- so travelers can see packages they lost (not just active bids)
CREATE OR REPLACE FUNCTION public.traveler_has_active_assignment(_user_id uuid, _package_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = _package_id
      AND t.user_id = _user_id
      AND pa.status NOT IN ('expired', 'cancelled')
  )
$$;
