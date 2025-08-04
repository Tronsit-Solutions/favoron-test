-- Add email notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_notification_preferences jsonb DEFAULT jsonb_build_object(
  'package', true,
  'trip', true, 
  'payment', true,
  'approval', true,
  'quote', true,
  'delivery', true,
  'general', false
);

-- Update existing users to have default preferences
UPDATE public.profiles 
SET email_notification_preferences = jsonb_build_object(
  'package', true,
  'trip', true,
  'payment', true, 
  'approval', true,
  'quote', true,
  'delivery', true,
  'general', false
)
WHERE email_notification_preferences IS NULL;