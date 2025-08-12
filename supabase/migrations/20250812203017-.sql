-- Create a function for admins to efficiently view all users at once
CREATE OR REPLACE FUNCTION public.admin_view_all_users(
    access_reason text DEFAULT 'Admin user management dashboard'
)
RETURNS TABLE(
    id uuid,
    first_name text,
    last_name text,
    email text,
    username text,
    phone_number text,
    created_at timestamp with time zone,
    trust_level text,
    user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    -- Log the bulk access
    INSERT INTO public.admin_profile_access_log (
        admin_user_id, 
        accessed_profile_id, 
        access_type, 
        reason
    ) VALUES (
        auth.uid(), 
        auth.uid(), -- Using admin's own ID for bulk access log
        'view_all_users', 
        access_reason
    );
    
    -- Return all user profiles with their roles
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.username,
        p.phone_number,
        p.created_at,
        p.trust_level::text,
        COALESCE(ur.role::text, 'user') as user_role
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    ORDER BY p.created_at DESC;
END;
$$;