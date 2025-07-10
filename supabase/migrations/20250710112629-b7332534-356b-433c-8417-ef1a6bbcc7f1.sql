-- Create package messages table for chat/timeline functionality
CREATE TABLE public.package_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'file_upload', 'status_update')),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_package_messages_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_package_messages_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.package_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to view messages of packages they're involved in (shopper, traveler, or admin)
CREATE POLICY "Users can view messages for packages they're involved in"
ON public.package_messages
FOR SELECT
USING (
  package_id IN (
    SELECT id FROM packages 
    WHERE user_id = auth.uid() -- shopper (package creator)
    OR matched_trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
    )
  )
  OR has_role(auth.uid(), 'admin'::user_role) -- admin
);

-- Policy for users to insert messages for packages they're involved in
CREATE POLICY "Users can insert messages for packages they're involved in"
ON public.package_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND package_id IN (
    SELECT id FROM packages 
    WHERE user_id = auth.uid() -- shopper (package creator)
    OR matched_trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
    )
  )
);

-- Policy for users to update their own messages
CREATE POLICY "Users can update their own messages"
ON public.package_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for admins to delete any message
CREATE POLICY "Admins can delete any message"
ON public.package_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_package_messages_updated_at
BEFORE UPDATE ON public.package_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for package chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('package-chat-files', 'package-chat-files', false);

-- Storage policies for package chat files
CREATE POLICY "Users can view chat files for their packages"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'package-chat-files' 
  AND (
    -- Extract package_id from folder path and check if user is involved
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM packages 
      WHERE user_id = auth.uid() -- shopper
      OR matched_trip_id IN (
        SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
      )
    )
    OR has_role(auth.uid(), 'admin'::user_role) -- admin
  )
);

CREATE POLICY "Users can upload chat files for their packages"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'package-chat-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM packages 
    WHERE user_id = auth.uid() -- shopper
    OR matched_trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
    )
  )
);

CREATE POLICY "Users can update chat files for their packages"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'package-chat-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM packages 
    WHERE user_id = auth.uid() -- shopper
    OR matched_trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
    )
  )
);

CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'package-chat-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM packages 
    WHERE user_id = auth.uid() -- shopper
    OR matched_trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid() -- traveler
    )
  )
);