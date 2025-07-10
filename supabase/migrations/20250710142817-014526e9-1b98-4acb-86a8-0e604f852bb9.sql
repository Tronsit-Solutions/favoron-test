-- Update RLS policies to allow admins to insert and update messages in package chats

-- Update INSERT policy to allow admins to insert messages
DROP POLICY IF EXISTS "Users can insert messages for packages they're involved in" ON public.package_messages;

CREATE POLICY "Users can insert messages for packages they're involved in" 
ON public.package_messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (
    (package_id IN ( 
      SELECT packages.id
      FROM packages
      WHERE ((packages.user_id = auth.uid()) OR (packages.matched_trip_id IN ( 
        SELECT trips.id
        FROM trips
        WHERE (trips.user_id = auth.uid())
      )))
    )) OR 
    has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Update UPDATE policy to allow admins to update any message
DROP POLICY IF EXISTS "Users can update their own messages" ON public.package_messages;

CREATE POLICY "Users can update their own messages" 
ON public.package_messages 
FOR UPDATE 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::user_role))
WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::user_role));