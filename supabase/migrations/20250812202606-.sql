-- Implement secure admin access to profiles with audit logging
-- This replaces the overly broad admin access with controlled, logged access

-- First, create an audit log table for admin profile access
CREATE TABLE IF NOT EXISTS public.admin_profile_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL,
    accessed_profile_id uuid NOT NULL,
    access_type text NOT NULL, -- 'view', 'sensitive_data', 'banking_info'
    reason text, -- Admin must provide reason for access
    accessed_at timestamp with time zone DEFAULT now(),
    session_info jsonb -- Store session/request info
);

-- Enable RLS on audit log
ALTER TABLE public.admin_profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_profile_access_log 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.admin_profile_access_log
FOR INSERT
WITH CHECK (true);

-- Drop the overly permissive admin policy
DROP POLICY "Users can view own profile or admins can view all" ON public.profiles;

-- Create a restrictive policy - users can only view their own profiles
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create secure admin functions for controlled access with audit logging
CREATE OR REPLACE FUNCTION public.admin_view_profile_basic(
    target_user_id uuid,
    access_reason text DEFAULT 'Administrative review'
)
RETURNS TABLE(
    id uuid,
    first_name text,
    last_name text,
    email text,
    username text,
    created_at timestamp with time zone,
    trust_level text
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
    
    -- Log the access
    INSERT INTO public.admin_profile_access_log (
        admin_user_id, 
        accessed_profile_id, 
        access_type, 
        reason
    ) VALUES (
        auth.uid(), 
        target_user_id, 
        'view_basic', 
        access_reason
    );
    
    -- Return basic profile info (non-sensitive)
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.username,
        p.created_at,
        p.trust_level::text
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;

-- Function for accessing sensitive data (requires elevated justification)
CREATE OR REPLACE FUNCTION public.admin_view_profile_sensitive(
    target_user_id uuid,
    access_reason text -- Required for sensitive data access
)
RETURNS TABLE(
    id uuid,
    phone_number text,
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
    
    -- Require access reason for sensitive data
    IF access_reason IS NULL OR LENGTH(TRIM(access_reason)) < 10 THEN
        RAISE EXCEPTION 'Access denied: Detailed reason required for sensitive data access (minimum 10 characters)';
    END IF;
    
    -- Log the sensitive access
    INSERT INTO public.admin_profile_access_log (
        admin_user_id, 
        accessed_profile_id, 
        access_type, 
        reason
    ) VALUES (
        auth.uid(), 
        target_user_id, 
        'view_sensitive', 
        access_reason
    );
    
    -- Return sensitive profile info
    RETURN QUERY
    SELECT 
        p.id,
        p.phone_number,
        p.document_type,
        p.document_number,
        p.country_code
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;

-- Function for accessing banking information (highest security level)
CREATE OR REPLACE FUNCTION public.admin_view_profile_banking(
    target_user_id uuid,
    access_reason text -- Required and must be substantial
)
RETURNS TABLE(
    id uuid,
    bank_account_holder text,
    bank_name text,
    bank_account_type text,
    bank_account_number text,
    bank_swift_code text
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
    
    -- Require substantial justification for banking data access
    IF access_reason IS NULL OR LENGTH(TRIM(access_reason)) < 20 THEN
        RAISE EXCEPTION 'Access denied: Detailed justification required for banking data access (minimum 20 characters)';
    END IF;
    
    -- Log the banking access with high priority
    INSERT INTO public.admin_profile_access_log (
        admin_user_id, 
        accessed_profile_id, 
        access_type, 
        reason
    ) VALUES (
        auth.uid(), 
        target_user_id, 
        'view_banking', 
        access_reason
    );
    
    -- Return banking info
    RETURN QUERY
    SELECT 
        p.id,
        p.bank_account_holder,
        p.bank_name,
        p.bank_account_type,
        p.bank_account_number,
        p.bank_swift_code
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;