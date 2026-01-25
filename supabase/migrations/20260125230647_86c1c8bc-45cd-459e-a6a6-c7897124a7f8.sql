-- Add delivery status tracking columns to whatsapp_notification_logs
ALTER TABLE public.whatsapp_notification_logs 
ADD COLUMN IF NOT EXISTS delivery_status TEXT,
ADD COLUMN IF NOT EXISTS delivery_error_code TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add index for faster lookups by twilio_sid (used by webhook)
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_twilio_sid ON public.whatsapp_notification_logs(twilio_sid) WHERE twilio_sid IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.whatsapp_notification_logs.delivery_status IS 'Final delivery status from Twilio webhook: queued, sent, delivered, read, undelivered, failed';
COMMENT ON COLUMN public.whatsapp_notification_logs.delivery_error_code IS 'Error code from Twilio if delivery failed';
COMMENT ON COLUMN public.whatsapp_notification_logs.delivered_at IS 'Timestamp when message was delivered or read';