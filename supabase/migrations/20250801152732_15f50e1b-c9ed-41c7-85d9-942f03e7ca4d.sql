-- Add DPI field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dpi text;