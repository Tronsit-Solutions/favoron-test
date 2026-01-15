-- Enable WhatsApp notifications for all existing users
UPDATE public.profiles 
SET whatsapp_notifications = true 
WHERE whatsapp_notifications = false OR whatsapp_notifications IS NULL;

-- Change default value to true for new users
ALTER TABLE public.profiles 
ALTER COLUMN whatsapp_notifications SET DEFAULT true;