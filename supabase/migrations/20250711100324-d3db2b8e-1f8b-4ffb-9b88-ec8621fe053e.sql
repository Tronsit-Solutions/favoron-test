-- Make package-chat-files bucket public so images can be viewed directly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'package-chat-files';

-- Create RLS policies for package-chat-files bucket to allow users to view files for packages they have access to
CREATE POLICY "Users can view chat files for their packages" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'package-chat-files' 
  AND (
    -- Extract package_id from file path (first part before /)
    split_part(name, '/', 1) IN (
      SELECT id::text FROM packages 
      WHERE user_id = auth.uid() 
         OR matched_trip_id IN (
           SELECT id FROM trips WHERE user_id = auth.uid()
         )
    )
    OR 
    -- Allow admins to view all files
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Allow users to upload files for packages they have access to
CREATE POLICY "Users can upload chat files for their packages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'package-chat-files' 
  AND (
    -- Extract package_id from file path (first part before /)
    split_part(name, '/', 1) IN (
      SELECT id::text FROM packages 
      WHERE user_id = auth.uid() 
         OR matched_trip_id IN (
           SELECT id FROM trips WHERE user_id = auth.uid()
         )
    )
    OR 
    -- Allow admins to upload files for any package
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);