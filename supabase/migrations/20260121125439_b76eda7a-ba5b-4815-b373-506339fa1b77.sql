-- Fix RLS policy for traveler package dismissal
-- The issue: when a traveler dismisses an expired package, the WITH CHECK clause fails
-- because matched_trip_id becomes NULL and the traveler is not the package owner

DROP POLICY IF EXISTS "Users can update packages optimized" ON public.packages;

CREATE POLICY "Users can update packages optimized" 
ON public.packages 
FOR UPDATE 
USING (
  -- Package owner can update
  (user_id = auth.uid()) 
  OR 
  -- Assigned traveler can update (checking CURRENT value before update)
  (matched_trip_id IN (
    SELECT trips.id 
    FROM trips 
    WHERE trips.user_id = auth.uid()
  ))
  OR 
  -- Admins can update any package
  (EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ))
)
WITH CHECK (
  -- Package owner can update
  (user_id = auth.uid()) 
  OR 
  -- NEW CONDITION: Allow traveler dismissal pattern
  -- When dismissing, traveler_dismissed_at is set and matched_trip_id becomes NULL
  (traveler_dismissed_at IS NOT NULL AND matched_trip_id IS NULL)
  OR
  -- Assigned traveler can maintain/modify match (when matched_trip_id is NOT NULL)
  (matched_trip_id IS NOT NULL AND matched_trip_id IN (
    SELECT trips.id 
    FROM trips 
    WHERE trips.user_id = auth.uid()
  ))
  OR 
  -- Admins can do anything
  (EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ))
);