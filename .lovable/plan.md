

## Fix: Infinite recursion in packages RLS

### Root Cause
The new policy "Travelers can view packages they are assigned to" joins `package_assignments → trips`. But `package_assignments` has its own RLS policy "Shoppers can view assignments for their packages" which queries back into `packages` (`package_id IN (SELECT id FROM packages WHERE ...)`). This circular reference causes infinite recursion for every SELECT on `packages` — blocking everyone, including admins.

### Fix

1. **Drop the recursive policy** immediately
2. **Create a security definer function** `has_active_assignment(uuid, uuid)` that checks `package_assignments` without triggering RLS
3. **Re-create the policy** using the security definer function instead of a direct JOIN

```sql
-- Step 1: Drop the broken policy
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

-- Step 3: Re-create the policy using the function
CREATE POLICY "Travelers can view packages they are assigned to"
ON public.packages FOR SELECT
TO authenticated
USING (
  traveler_has_active_assignment(auth.uid(), id)
);
```

### Files
1. SQL migration — drop policy, create function, re-create policy

This will immediately restore access for everyone while still granting travelers visibility into their assigned packages.

