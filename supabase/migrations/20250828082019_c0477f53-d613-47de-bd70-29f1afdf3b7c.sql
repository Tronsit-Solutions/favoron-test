-- Create customer photos table
CREATE TABLE public.customer_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  customer_name TEXT,
  product_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view approved photos" 
ON public.customer_photos 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Admins can manage all photos" 
ON public.customer_photos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Create storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-photos', 'customer-photos', true);

-- Storage policies
CREATE POLICY "Public can view customer photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-photos');

CREATE POLICY "Admins can upload customer photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'customer-photos' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update customer photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'customer-photos' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete customer photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'customer-photos' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_customer_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_photos_updated_at
  BEFORE UPDATE ON public.customer_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_photos_updated_at();