
-- Allow operations role to also update packages in delivered_to_office, ready_for_pickup, ready_for_delivery statuses
-- This is needed for the revert confirmation feature
DROP POLICY IF EXISTS "Operations can confirm office delivery" ON public.packages;

CREATE POLICY "Operations can confirm office delivery"
ON public.packages
FOR UPDATE
TO authenticated
USING (
  has_operations_role(auth.uid()) 
  AND (status = ANY (ARRAY['in_transit'::text, 'received_by_traveler'::text, 'pending_office_confirmation'::text, 'delivered_to_office'::text, 'ready_for_pickup'::text, 'ready_for_delivery'::text]))
)
WITH CHECK (has_operations_role(auth.uid()));
