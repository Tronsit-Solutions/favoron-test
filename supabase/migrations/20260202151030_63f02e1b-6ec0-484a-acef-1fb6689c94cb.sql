-- Create safe refund order creation function with advisory lock to prevent duplicates
CREATE OR REPLACE FUNCTION public.create_refund_order_safe(
  p_package_id uuid,
  p_shopper_id uuid,
  p_bank_name text,
  p_bank_account_holder text,
  p_bank_account_number text,
  p_bank_account_type text,
  p_amount numeric,
  p_reason text,
  p_cancelled_products jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_refund_id uuid;
BEGIN
  -- Serialize access for this package using advisory lock
  PERFORM pg_advisory_xact_lock(hashtext('refund_order_' || p_package_id::text));
  
  -- Check if there's already a pending or approved refund order for this package
  IF EXISTS (
    SELECT 1 FROM refund_orders
    WHERE package_id = p_package_id
      AND status IN ('pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'Ya existe una orden de reembolso pendiente para este paquete';
  END IF;
  
  -- Create the refund order
  INSERT INTO refund_orders (
    package_id,
    shopper_id,
    bank_name,
    bank_account_holder,
    bank_account_number,
    bank_account_type,
    amount,
    reason,
    cancelled_products,
    status
  ) VALUES (
    p_package_id,
    p_shopper_id,
    p_bank_name,
    p_bank_account_holder,
    p_bank_account_number,
    p_bank_account_type,
    p_amount,
    p_reason,
    p_cancelled_products,
    'pending'
  )
  RETURNING id INTO new_refund_id;
  
  RETURN new_refund_id;
END;
$$;