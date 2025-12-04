-- Create refund_orders table for tracking partial refunds when shoppers cancel products
CREATE TABLE public.refund_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id),
  shopper_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Bank details for refund
  bank_name TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_type TEXT NOT NULL DEFAULT 'monetary',
  
  -- Refund details
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL DEFAULT 'product_unavailable',
  cancelled_products JSONB NOT NULL DEFAULT '[]',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  receipt_url TEXT,
  receipt_filename TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.refund_orders ENABLE ROW LEVEL SECURITY;

-- Shoppers can create refund orders for their own packages
CREATE POLICY "Shoppers can create refund orders for own packages"
ON public.refund_orders
FOR INSERT
WITH CHECK (
  auth.uid() = shopper_id 
  AND EXISTS (
    SELECT 1 FROM packages p 
    WHERE p.id = package_id 
    AND p.user_id = auth.uid()
  )
);

-- Shoppers can view their own refund orders
CREATE POLICY "Shoppers can view own refund orders"
ON public.refund_orders
FOR SELECT
USING (auth.uid() = shopper_id);

-- Admins can view all refund orders
CREATE POLICY "Admins can view all refund orders"
ON public.refund_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Admins can update refund orders
CREATE POLICY "Admins can update refund orders"
ON public.refund_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Admins can delete refund orders
CREATE POLICY "Admins can delete refund orders"
ON public.refund_orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX idx_refund_orders_package_id ON public.refund_orders(package_id);
CREATE INDEX idx_refund_orders_shopper_id ON public.refund_orders(shopper_id);
CREATE INDEX idx_refund_orders_status ON public.refund_orders(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_refund_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_refund_orders_updated_at
BEFORE UPDATE ON public.refund_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_refund_orders_updated_at();