-- Add foreign key constraint for package_messages.user_id -> profiles.id
ALTER TABLE public.package_messages 
ADD CONSTRAINT fk_package_messages_user 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for package_messages.package_id -> packages.id  
ALTER TABLE public.package_messages 
ADD CONSTRAINT fk_package_messages_package 
FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;