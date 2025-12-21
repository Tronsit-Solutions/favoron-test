-- Remove the policy that allows all users to view active discount codes
DROP POLICY IF EXISTS "Users can view active discount_codes" ON public.discount_codes;

-- Note: The "Admins can do everything with discount_codes" policy already exists
-- and handles admin access. Users can still validate codes through the 
-- validate_discount_code() SECURITY DEFINER function.