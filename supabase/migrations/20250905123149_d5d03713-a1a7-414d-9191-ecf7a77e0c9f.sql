-- Secure trips_with_user: enable RLS and restrict access to admins only

-- Ensure the object exists and lock down privileges first
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC, anon, authenticated;

-- Enable and force Row Level Security
ALTER TABLE public.trips_with_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips_with_user FORCE ROW LEVEL SECURITY;

-- Create admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can view trips_with_user" ON public.trips_with_user;
CREATE POLICY "Admins can view trips_with_user"
ON public.trips_with_user
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Do not allow INSERT/UPDATE/DELETE (no policies created) to prevent modifications by clients
-- If any grants were present, RLS will now gate all queries except those matching the policy