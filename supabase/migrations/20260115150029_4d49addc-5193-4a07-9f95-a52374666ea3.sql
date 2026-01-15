-- Create marketing_investments table for CAC calculations
CREATE TABLE public.marketing_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL,
  month TEXT NOT NULL, -- formato 'YYYY-MM'
  investment DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(channel, month)
);

-- Enable RLS
ALTER TABLE public.marketing_investments ENABLE ROW LEVEL SECURITY;

-- Only admins can manage marketing investments
CREATE POLICY "Admins can manage marketing investments" ON public.marketing_investments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_marketing_investments_updated_at
  BEFORE UPDATE ON public.marketing_investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.marketing_investments IS 'Stores monthly marketing investment data per channel for CAC calculations';