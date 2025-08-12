-- Fix security issue: Travel Plans and Personal Addresses Exposed
-- Update RLS policy for trips table to restrict access

-- Drop existing policy that allows all users to see approved trips
DROP POLICY IF EXISTS "Users can view trips optimized" ON public.trips;

-- Create new restrictive policy: users can only see their own trips or admins can see all
CREATE POLICY "Users can view own trips only, admins see all" 
ON public.trips 
FOR SELECT 
USING (
  -- User can see their own trips
  (auth.uid() = user_id) 
  OR 
  -- Admins can see all trips
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
);