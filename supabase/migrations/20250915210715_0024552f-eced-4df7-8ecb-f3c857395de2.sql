-- Fix High-Risk Security Issues (Step 1: Handle existing data)

-- 1. Remove public access to customer photos (CRITICAL)
DROP POLICY IF EXISTS "Public can view showcase photos" ON public.customer_photos;

-- 2. Fix existing admin role assignments to comply with new constraints
-- Update existing admin roles to have proper assigned_by values
UPDATE public.user_roles 
SET assigned_by = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::user_role 
  AND user_id != public.user_roles.user_id
  LIMIT 1
)
WHERE role = 'admin'::user_role 
AND (assigned_by IS NULL OR assigned_by = user_id);

-- If no other admin exists, keep the first admin without assigned_by constraint
-- (This handles the bootstrap case)

-- 3. Create more restrictive policy for user role insertion
DROP POLICY IF EXISTS "Users can insert their own role only" ON public.user_roles;

CREATE POLICY "Users can insert basic role only" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'user'::user_role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- 4. Add database-level protection against unauthorized admin creation
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow admin role assignment by existing admins (except initial setup)
  IF NEW.role = 'admin'::user_role THEN
    -- Allow if assigned by an existing admin (and not self-assignment)
    IF NEW.assigned_by IS NOT NULL 
       AND NEW.assigned_by != NEW.user_id 
       AND EXISTS (
         SELECT 1 FROM public.user_roles 
         WHERE user_id = NEW.assigned_by 
         AND role = 'admin'::user_role
       ) THEN
      RETURN NEW;
    -- Allow if this is the first admin (no existing admins)
    ELSIF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'admin'::user_role
    ) THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Only existing admins can assign admin roles, and self-assignment is not allowed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce admin role assignment rules
DROP TRIGGER IF EXISTS enforce_admin_assignment ON public.user_roles;
CREATE TRIGGER enforce_admin_assignment
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_admin_creation();