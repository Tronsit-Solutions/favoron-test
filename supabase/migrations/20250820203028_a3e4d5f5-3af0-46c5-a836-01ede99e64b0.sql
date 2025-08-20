-- Create table for Favorón's bank account information
CREATE TABLE public.favoron_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'monetary',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favoron_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active bank accounts" 
ON public.favoron_bank_accounts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can insert bank accounts" 
ON public.favoron_bank_accounts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update bank accounts" 
ON public.favoron_bank_accounts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete bank accounts" 
ON public.favoron_bank_accounts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert initial Favorón bank account data
INSERT INTO public.favoron_bank_accounts (
  bank_name,
  account_holder,
  account_number,
  account_type,
  is_active
) VALUES (
  'Banco Industrial',
  'Favorón S.A.',
  '1234567890',
  'Monetaria',
  true
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_favoron_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_favoron_bank_accounts_updated_at
  BEFORE UPDATE ON public.favoron_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favoron_bank_accounts_updated_at();