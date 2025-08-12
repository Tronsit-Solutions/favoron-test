-- Update the admin function to include all user information including banking details
CREATE OR REPLACE FUNCTION public.admin_view_all_users(
    access_reason text DEFAULT 'Admin user management dashboard - full access'
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
    user_role text,
    -- Banking information
    bank_account_holder text,
    bank_name text,
    bank_account_type text,
    bank_account_number text,
    bank_swift_code text,
    -- Additional sensitive data
    document_type text,
    document_number text,
    country_code text
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
    
    -- Log the bulk access with full information access
    INSERT INTO public.admin_profile_access_log (
        admin_user_id, 
        accessed_profile_id, 
        access_type, 
        reason
    ) VALUES (
        auth.uid(), 
        auth.uid(), -- Using admin's own ID for bulk access log
        'view_all_users_full', 
        access_reason
    );
    
    -- Return all user profiles with complete information including banking
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
        COALESCE(ur.role::text, 'user') as user_role,
        -- Banking information
        p.bank_account_holder,
        p.bank_name,
        p.bank_account_type,
        p.bank_account_number,
        p.bank_swift_code,
        -- Additional sensitive data
        p.document_type,
        p.document_number,
        p.country_code
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.id
    ORDER BY p.created_at DESC;
END;
$$;