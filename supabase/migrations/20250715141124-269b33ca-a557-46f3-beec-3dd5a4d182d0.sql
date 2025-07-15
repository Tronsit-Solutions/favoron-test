-- Fix RLS policies to ensure admins can see all packages including pending_approval

-- Update the packages SELECT policy to allow admins to see all packages
DROP POLICY IF EXISTS "Users can view packages they created or that are matched to the" ON packages;

CREATE POLICY "Users can view packages they created or that are matched to their trips or admins can view all" 
ON packages FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Ensure trips policy allows admins to see all trips
DROP POLICY IF EXISTS "Users can view all approved trips and their own trips" ON trips;

CREATE POLICY "Users can view all approved trips and their own trips or admins can view all" 
ON trips FOR SELECT 
USING (
  (status <> 'pending_approval'::text) OR 
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::user_role)
);

-- Ensure admins can see all package messages
DROP POLICY IF EXISTS "Users can view messages for packages they're involved in" ON package_messages;

CREATE POLICY "Users can view messages for packages they're involved in or admins can view all" 
ON package_messages FOR SELECT 
USING (
  (package_id IN (
    SELECT id FROM packages 
    WHERE (user_id = auth.uid()) OR 
          (matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))
  )) OR 
  has_role(auth.uid(), 'admin'::user_role)
);