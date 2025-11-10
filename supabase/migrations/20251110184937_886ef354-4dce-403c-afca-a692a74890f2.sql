-- Remove the database trigger approach for WhatsApp chat notifications
-- We will send these notifications from the frontend instead

DROP TRIGGER IF EXISTS on_chat_message_sent ON public.package_messages;
DROP FUNCTION IF EXISTS public.notify_chat_message();