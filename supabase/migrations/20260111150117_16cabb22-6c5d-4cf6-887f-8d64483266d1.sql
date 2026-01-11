-- Fix infinite recursion: Create SECURITY DEFINER function to bypass RLS when checking packages
CREATE OR REPLACE FUNCTION public.user_has_package_on_trip(trip_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM packages 
    WHERE packages.matched_trip_id = trip_id 
    AND packages.user_id = user_id
  );
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Shoppers can view trips where their package is assigned" ON trips;

-- Create new policy using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Shoppers can view trips where their package is assigned"
ON trips
FOR SELECT
USING (
  public.user_has_package_on_trip(trips.id, auth.uid())
);