-- Fix customer photos security issue
-- Create a more secure policy that only allows public access for testimonials without exposing personal data

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view approved photos with consent" ON public.customer_photos;

-- Create a new policy that only allows viewing approved photos for testimonial purposes
-- This restricts access to only photos explicitly marked for public testimonial use
CREATE POLICY "Public can view testimonial photos only" 
ON public.customer_photos 
FOR SELECT 
USING (
  status = 'approved' 
  AND customer_consent = true 
  AND usage_type = 'testimonial'
);

-- Add an index to improve performance for public queries
CREATE INDEX IF NOT EXISTS idx_customer_photos_public_testimonials 
ON public.customer_photos (status, customer_consent, usage_type) 
WHERE status = 'approved' AND customer_consent = true AND usage_type = 'testimonial';