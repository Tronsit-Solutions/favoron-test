-- Add email notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_notifications boolean DEFAULT true;