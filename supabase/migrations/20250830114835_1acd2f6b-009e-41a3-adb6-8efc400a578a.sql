-- Enable RLS on the trips_with_user view
ALTER VIEW public.trips_with_user SET (security_invoker = on);

-- Create RLS policies for the trips_with_user view
-- These should mirror the existing trips table policies

-- Users can view own trips only, admins see all
CREATE POLICY "Users can view own trips only, admins see all trips_with_user" 
ON public.trips_with_user
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
);

-- Enable RLS on the view
ALTER VIEW public.trips_with_user ENABLE ROW LEVEL SECURITY;