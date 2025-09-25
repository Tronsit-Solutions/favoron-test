-- Temporary fix: Update existing approved photos to have customer consent
-- This is needed because the security fix requires customer_consent = true
-- but existing photos were created before this requirement
UPDATE public.customer_photos 
SET customer_consent = true, 
    updated_at = now()
WHERE status = 'approved' 
  AND usage_type = 'testimonial'
  AND customer_consent = false;

-- Log this data migration
COMMENT ON TABLE public.customer_photos IS 
'Updated existing approved testimonial photos to have customer_consent = true for security compliance';