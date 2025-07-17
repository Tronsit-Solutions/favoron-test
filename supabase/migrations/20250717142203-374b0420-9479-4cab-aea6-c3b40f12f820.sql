-- Create a table for pending payment orders
CREATE TABLE public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL,
  traveler_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bank_account_holder TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  CONSTRAINT fk_payment_order_package FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_order_traveler FOREIGN KEY (traveler_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all payment orders"
ON public.payment_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Travelers can view their own payment orders"
ON public.payment_orders
FOR SELECT
USING (auth.uid() = traveler_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_payment_orders_traveler_id ON public.payment_orders(traveler_id);
CREATE INDEX idx_payment_orders_package_id ON public.payment_orders(package_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);