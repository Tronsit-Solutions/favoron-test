-- Update storage policies for package-chat-files bucket to allow admins to upload files

-- Drop existing restrictive policies (if they exist)
DROP POLICY IF EXISTS "Users can upload chat files for their packages" ON storage.objects;
DROP POLICY IF EXISTS "Users can update chat files for their packages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can update chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can delete chat files" ON storage.objects;

-- Recreate INSERT policy to include admins
CREATE POLICY "Users and admins can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'package-chat-files' 
    AND (
      -- Users can upload to their own packages or matched trips
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.packages 
        WHERE user_id = auth.uid() 
           OR matched_trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
      )
      -- OR user is admin
      OR public.has_role(auth.uid(), 'admin'::public.user_role)
    )
  );

-- Recreate UPDATE policy to include admins  
CREATE POLICY "Users and admins can update chat files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'package-chat-files' 
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.packages 
        WHERE user_id = auth.uid() 
           OR matched_trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
      )
      OR public.has_role(auth.uid(), 'admin'::public.user_role)
    )
  );

-- Recreate DELETE policy to include admins
CREATE POLICY "Users and admins can delete chat files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'package-chat-files' 
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.packages 
        WHERE user_id = auth.uid() 
           OR matched_trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
      )
      OR public.has_role(auth.uid(), 'admin'::public.user_role)
    )
  );