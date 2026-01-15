-- Create table to log all WhatsApp notification attempts
CREATE TABLE public.whatsapp_notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User recipient
  user_id uuid,
  phone_number text NOT NULL,
  user_name text,
  
  -- Template and variables
  template_id text NOT NULL,
  template_variables jsonb,
  
  -- Send result
  status text NOT NULL DEFAULT 'pending',
  twilio_sid text,
  error_message text,
  error_code integer,
  skip_reason text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  response_data jsonb
);

-- Indexes for efficient queries
CREATE INDEX idx_whatsapp_logs_user ON whatsapp_notification_logs(user_id);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_notification_logs(status);
CREATE INDEX idx_whatsapp_logs_template ON whatsapp_notification_logs(template_id);
CREATE INDEX idx_whatsapp_logs_created ON whatsapp_notification_logs(created_at DESC);

-- RLS: Only admins can view logs
ALTER TABLE whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp logs" ON whatsapp_notification_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- System can insert logs (edge function uses service role)
CREATE POLICY "System can insert whatsapp logs" ON whatsapp_notification_logs
  FOR INSERT WITH CHECK (true);