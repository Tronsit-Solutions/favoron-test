-- Add WhatsApp notification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_notification_preferences JSONB DEFAULT '{"package": true, "trip": true, "payment": true, "general": true}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.whatsapp_notifications IS 'Enable/disable all WhatsApp notifications for user';
COMMENT ON COLUMN public.profiles.whatsapp_notification_preferences IS 'User preferences for specific WhatsApp notification types';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_notifications ON public.profiles(whatsapp_notifications) WHERE whatsapp_notifications = true;