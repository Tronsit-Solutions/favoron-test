-- Allow shoppers to view trips where their package is assigned
-- This enables the QuoteDialog to show complete trip/traveler information
CREATE POLICY "Shoppers can view trips where their package is assigned"
ON trips
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM packages 
    WHERE packages.matched_trip_id = trips.id 
    AND packages.user_id = auth.uid()
  )
);