-- Add Recurrente payment integration columns to packages table
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS recurrente_checkout_id TEXT,
ADD COLUMN IF NOT EXISTS recurrente_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';

-- Add comment for documentation
COMMENT ON COLUMN public.packages.recurrente_checkout_id IS 'Recurrente checkout ID for card payments';
COMMENT ON COLUMN public.packages.recurrente_payment_id IS 'Recurrente payment ID after successful payment';
COMMENT ON COLUMN public.packages.payment_method IS 'Payment method used: bank_transfer (default) or card';

-- Create index for checkout lookups (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_packages_recurrente_checkout_id 
ON public.packages(recurrente_checkout_id) 
WHERE recurrente_checkout_id IS NOT NULL;