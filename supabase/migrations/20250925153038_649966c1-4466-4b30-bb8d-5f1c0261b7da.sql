-- Fix customer photos security vulnerability
-- Drop the current overly permissive public access policy
DROP POLICY IF EXISTS "Public can view testimonial photos only" ON public.customer_photos;

-- Create a new secure policy that requires authentication for viewing photos
CREATE POLICY "Authenticated users can view approved testimonial photos only" 
ON public.customer_photos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'approved' 
  AND customer_consent = true 
  AND usage_type = 'testimonial'
);

-- Add index for performance on the authenticated access pattern
CREATE INDEX IF NOT EXISTS idx_customer_photos_public_access 
ON public.customer_photos(status, customer_consent, usage_type, created_at) 
WHERE status = 'approved' AND customer_consent = true AND usage_type = 'testimonial';

-- Log this security fix
COMMENT ON POLICY "Authenticated users can view approved testimonial photos only" ON public.customer_photos IS 
'Security fix: Restricted public access to customer photos to require authentication, preventing unauthorized access to customer names and images';