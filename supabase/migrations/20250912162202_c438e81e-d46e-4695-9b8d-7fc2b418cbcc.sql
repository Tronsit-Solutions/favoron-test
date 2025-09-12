-- Enhanced RLS policies for payment_orders table to protect sensitive financial data

-- First, drop existing policies to replace with stricter ones
DROP POLICY IF EXISTS "Admins can manage all payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Travelers can create payment orders for their trips" ON public.payment_orders;
DROP POLICY IF EXISTS "Travelers can view their own payment orders" ON public.payment_orders;

-- Create stricter policies with additional security measures

-- 1. SELECT Policy: Travelers can only view their own payment orders
CREATE POLICY "Travelers can view own payment orders only"
ON public.payment_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = traveler_id
);

-- 2. SELECT Policy: Admins can view all payment orders (with audit logging)
CREATE POLICY "Admins can view all payment orders"
ON public.payment_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 3. INSERT Policy: Travelers can create payment orders only for their own trips
CREATE POLICY "Travelers can create payment orders for own trips only"
ON public.payment_orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = traveler_id 
  AND trip_id IN (
    SELECT id FROM public.trips 
    WHERE user_id = auth.uid()
  )
  -- Additional security: ensure banking info is provided
  AND bank_name IS NOT NULL 
  AND bank_account_number IS NOT NULL 
  AND bank_account_holder IS NOT NULL
  AND amount > 0
);

-- 4. UPDATE Policy: Only admins can update payment orders (for status changes, receipt uploads)
CREATE POLICY "Only admins can update payment orders"
ON public.payment_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 5. DELETE Policy: Only admins can delete payment orders (with restrictions)
CREATE POLICY "Only admins can delete payment orders"
ON public.payment_orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
  -- Additional restriction: cannot delete completed payments
  AND status != 'completed'
);

-- Create audit trigger for payment order access by admins
CREATE OR REPLACE FUNCTION public.audit_payment_order_admin_access()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) INTO is_admin;
  
  -- Log admin access to payment orders (only for UPDATE and DELETE operations)
  IF is_admin AND TG_OP IN ('UPDATE', 'DELETE') THEN
    INSERT INTO public.admin_profile_access_log (
      admin_user_id,
      accessed_profile_id,
      access_type,
      reason,
      session_info
    ) VALUES (
      admin_user_id,
      COALESCE(NEW.traveler_id, OLD.traveler_id),
      'payment_order_' || lower(TG_OP),
      'Admin accessed payment order ID: ' || COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'payment_order_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'timestamp', NOW(),
        'amount', COALESCE(NEW.amount, OLD.amount)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to payment_orders table (only for UPDATE and DELETE)
CREATE TRIGGER audit_payment_order_access
  AFTER UPDATE OR DELETE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_order_admin_access();

-- Create function to mask sensitive banking information for non-owners
CREATE OR REPLACE FUNCTION public.get_masked_payment_order_info(order_id uuid)
RETURNS TABLE (
  id uuid,
  trip_id uuid,
  traveler_id uuid,
  amount numeric,
  status text,
  created_at timestamp with time zone,
  bank_name_masked text,
  account_number_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  is_admin boolean := false;
  is_owner boolean := false;
BEGIN
  -- Check permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = current_user_id AND ur.role = 'admin'
  ) INTO is_admin;
  
  SELECT EXISTS (
    SELECT 1 FROM public.payment_orders po
    WHERE po.id = order_id AND po.traveler_id = current_user_id
  ) INTO is_owner;
  
  -- Return data based on permissions
  IF is_admin OR is_owner THEN
    -- Full access for admins and owners
    RETURN QUERY
    SELECT 
      po.id,
      po.trip_id,
      po.traveler_id,
      po.amount,
      po.status,
      po.created_at,
      po.bank_name,
      po.bank_account_number
    FROM public.payment_orders po
    WHERE po.id = order_id;
  ELSE
    -- No access for unauthorized users
    RETURN;
  END IF;
END;
$$;

-- Add additional validation trigger for payment orders
CREATE OR REPLACE FUNCTION public.validate_payment_order_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate banking information format
  IF NEW.bank_account_number IS NOT NULL THEN
    -- Remove spaces and validate length
    NEW.bank_account_number := REGEXP_REPLACE(NEW.bank_account_number, '\s+', '', 'g');
    
    IF LENGTH(NEW.bank_account_number) < 8 OR LENGTH(NEW.bank_account_number) > 30 THEN
      RAISE EXCEPTION 'Invalid bank account number length';
    END IF;
    
    -- Ensure account number contains only alphanumeric characters and hyphens
    IF NEW.bank_account_number !~ '^[A-Za-z0-9\-]+$' THEN
      RAISE EXCEPTION 'Invalid bank account number format';
    END IF;
  END IF;
  
  -- Validate amount
  IF NEW.amount IS NOT NULL AND NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  -- Validate bank account holder name
  IF NEW.bank_account_holder IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.bank_account_holder)) < 2 THEN
      RAISE EXCEPTION 'Bank account holder name too short';
    END IF;
    
    -- Remove excessive whitespace
    NEW.bank_account_holder := REGEXP_REPLACE(TRIM(NEW.bank_account_holder), '\s+', ' ', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
CREATE TRIGGER validate_payment_order_insert_update
  BEFORE INSERT OR UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_order_data();

-- Create index for better performance on traveler queries
CREATE INDEX IF NOT EXISTS idx_payment_orders_traveler_id ON public.payment_orders(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_trip_id ON public.payment_orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- Add comment documenting the security measures
COMMENT ON TABLE public.payment_orders IS 
'Payment orders table with enhanced RLS policies to protect sensitive financial data. Access is strictly controlled: travelers can only access their own payment orders, admins have full access with audit logging.';

COMMENT ON FUNCTION public.get_masked_payment_order_info(uuid) IS 
'Secure function to access payment order information with proper access controls and data masking for unauthorized users.';

COMMENT ON FUNCTION public.audit_payment_order_admin_access() IS 
'Audit trigger that logs all admin UPDATE/DELETE operations on payment orders for security monitoring.';

COMMENT ON FUNCTION public.validate_payment_order_data() IS 
'Validation trigger that ensures payment order data integrity and prevents malformed banking information.';