-- Add RLS policy to allow travelers to create payment orders for their own trips
CREATE POLICY "Travelers can create payment orders for their trips" ON public.payment_orders
FOR INSERT
WITH CHECK (
  auth.uid() = traveler_id 
  AND trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
);