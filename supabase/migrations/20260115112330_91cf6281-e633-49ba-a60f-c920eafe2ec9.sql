-- Create app_settings table for dynamic configuration
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can view app_settings"
  ON public.app_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Only admins can manage settings
CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Insert initial WhatsApp testing mode config (enabled by default for safety)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'whatsapp_testing_mode',
  '{"enabled": true, "whitelist": ["+34699591457"]}',
  'Controla si WhatsApp solo envía a números en whitelist'
);