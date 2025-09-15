-- Add consent mechanism to customer_photos table
ALTER TABLE public.customer_photos 
ADD COLUMN customer_consent boolean NOT NULL DEFAULT false,
ADD COLUMN consent_date timestamp with time zone,
ADD COLUMN usage_type text DEFAULT 'testimonial' CHECK (usage_type IN ('testimonial', 'marketing', 'showcase'));

-- Update RLS policy to require authentication and consent
DROP POLICY IF EXISTS "Everyone can view approved photos" ON public.customer_photos;

CREATE POLICY "Authenticated users can view approved photos with consent" 
ON public.customer_photos 
FOR SELECT 
TO authenticated
USING (status = 'approved' AND customer_consent = true);

-- Allow public access only for photos explicitly marked for public showcase
CREATE POLICY "Public can view showcase photos" 
ON public.customer_photos 
FOR SELECT 
TO anon
USING (status = 'approved' AND customer_consent = true AND usage_type = 'showcase');

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_customer_photos_consent ON public.customer_photos(customer_consent, status, usage_type);