-- Create helper function to check if user has operations role
CREATE OR REPLACE FUNCTION public.has_operations_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('operations', 'admin')
  )
$$;

-- RLS policy for operations to view packages in relevant statuses
CREATE POLICY "Operations can view packages for processing"
ON public.packages
FOR SELECT
USING (
  has_operations_role(auth.uid()) AND
  status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed')
);

-- RLS policy for operations to update package office delivery confirmation
CREATE POLICY "Operations can confirm office delivery"
ON public.packages
FOR UPDATE
USING (
  has_operations_role(auth.uid()) AND
  status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation')
)
WITH CHECK (
  has_operations_role(auth.uid())
);

-- RLS policy for operations to view trips for label generation
CREATE POLICY "Operations can view trips for labels"
ON public.trips
FOR SELECT
USING (has_operations_role(auth.uid()));

-- RLS policy for operations to update trip last_mile_delivered
CREATE POLICY "Operations can mark last mile delivered"
ON public.trips
FOR UPDATE
USING (has_operations_role(auth.uid()))
WITH CHECK (has_operations_role(auth.uid()));

-- RLS policy for operations to view basic profile info (name only, not financial)
CREATE POLICY "Operations can view basic profile info"
ON public.profiles
FOR SELECT
USING (has_operations_role(auth.uid()));