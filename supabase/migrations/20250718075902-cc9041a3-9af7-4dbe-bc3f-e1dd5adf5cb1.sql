-- Add receipt columns to payment_orders table
ALTER TABLE public.payment_orders 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_filename TEXT;