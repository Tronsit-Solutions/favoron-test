-- Create storage bucket for traveler confirmation photos
INSERT INTO storage.buckets (id, name, public) VALUES ('traveler-confirmations', 'traveler-confirmations', true);

-- Create policies for traveler confirmation photos
CREATE POLICY "Users can view confirmation photos for their packages" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'traveler-confirmations' AND 
  (
    -- Traveler can see their own uploads
    auth.uid()::text = (storage.foldername(name))[1] OR 
    -- Shopper can see photos of their packages  
    EXISTS (
      SELECT 1 FROM packages 
      WHERE user_id = auth.uid() 
      AND id::text = (storage.foldername(name))[2]
    ) OR
    -- Admin can see all
    has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Travelers can upload confirmation photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'traveler-confirmations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own confirmation photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'traveler-confirmations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own confirmation photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'traveler-confirmations' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);