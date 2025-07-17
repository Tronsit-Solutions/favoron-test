-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true);

-- Create RLS policies for payment receipts bucket
CREATE POLICY "Payment receipts are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Only admins can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update payment receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete payment receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add receipt_url column to payment_orders table
ALTER TABLE public.payment_orders 
ADD COLUMN receipt_url TEXT,
ADD COLUMN receipt_filename TEXT;