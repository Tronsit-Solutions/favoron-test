
-- Step 1: Drop the broken recursive policy
DROP POLICY "Travelers can view packages they are assigned to" ON public.packages;

-- Step 2: Create security definer function (bypasses RLS)
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
      AND pa.status NOT IN ('rejected', 'expired', 'cancelled')
  )
$$;

-- Step 3: Re-create the policy using the function (no recursion)
CREATE POLICY "Travelers can view packages they are assigned to"
ON public.packages FOR SELECT
TO authenticated
USING (
  traveler_has_active_assignment(auth.uid(), id)
);
