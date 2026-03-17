

## Fix: Travelers can't see assigned packages (RLS blocks the join)

### Problem
The traveler dashboard fetches `package_assignments` and does a nested join `packages(*)`. But the RLS SELECT policy on `packages` only grants access when `matched_trip_id` matches a traveler's trip. In the unified flow, `matched_trip_id` stays `NULL` until the shopper picks a winner — so the nested `packages(*)` returns `null` and the package is invisible.

### Fix: Add one RLS policy on `packages`

A new permissive SELECT policy that grants visibility to any traveler who has an active assignment for that package:

```sql
CREATE POLICY "Travelers can view packages they are assigned to"
ON public.packages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = packages.id
      AND t.user_id = auth.uid()
      AND pa.status NOT IN ('rejected', 'expired', 'cancelled')
  )
);
```

This is additive (permissive OR with existing policies). Once the winner is selected and `matched_trip_id` is set, the existing policy kicks in too. No frontend changes needed — the dashboard code already handles the data correctly once RLS allows it through.

### Also needed: UPDATE policy for assignment-based travelers

The existing UPDATE policy on `packages` checks `matched_trip_id IN (user's trips)`. A traveler with an active assignment but no `matched_trip_id` set yet won't be able to update the package (e.g., submitting quote writes to `package_assignments` via the frontend, but some flows may touch the package row). This is already handled since quote submission now writes to `package_assignments` directly, so no UPDATE policy change is needed.

### Files
1. SQL migration — one new RLS SELECT policy on `packages`

