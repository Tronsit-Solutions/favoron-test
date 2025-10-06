-- Enable Row Level Security on admin_profile_access_log
ALTER TABLE public.admin_profile_access_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_profile_access_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_profile_access_log;
DROP POLICY IF EXISTS "Prevent unauthorized modifications" ON public.admin_profile_access_log;

-- Policy 1: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_profile_access_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
  )
);

-- Policy 2: System can insert audit logs (triggered by log_admin_profile_access function)
CREATE POLICY "System can insert audit logs"
ON public.admin_profile_access_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Prevent all UPDATE and DELETE operations to maintain audit integrity
CREATE POLICY "Prevent unauthorized modifications"
ON public.admin_profile_access_log
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Comment on the table to document security measures
COMMENT ON TABLE public.admin_profile_access_log IS 
'Audit log for admin profile access. RLS enabled with strict policies: 
- Only admins can view logs (SELECT)
- System can insert logs via triggers (INSERT)
- No modifications allowed (UPDATE/DELETE blocked) to maintain audit integrity';
