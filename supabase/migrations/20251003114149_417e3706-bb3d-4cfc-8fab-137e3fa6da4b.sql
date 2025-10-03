-- Create RPC function to assign Prime membership
CREATE OR REPLACE FUNCTION public.admin_assign_prime_membership(
  _target_user_id UUID,
  _is_paid BOOLEAN DEFAULT false,
  _payment_reference TEXT DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bank_name TEXT;
  v_bank_account_holder TEXT;
  v_bank_account_number TEXT;
  v_bank_account_type TEXT;
  v_notes TEXT;
  v_existing_membership_count INTEGER;
BEGIN
  -- Verify admin access
  IF NOT verify_admin_access() THEN
    RAISE EXCEPTION 'Only admins can assign Prime memberships';
  END IF;

  -- Update profiles to Prime with expiration
  UPDATE public.profiles 
  SET 
    trust_level = 'prime',
    prime_expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
  WHERE id = _target_user_id;

  -- Check if approved membership already exists
  SELECT COUNT(*) INTO v_existing_membership_count
  FROM public.prime_memberships
  WHERE user_id = _target_user_id 
    AND status = 'approved';

  -- Only create new membership if none exists
  IF v_existing_membership_count = 0 THEN
    -- Get banking info from user_financial_data (latest record) or use fallback
    SELECT 
      COALESCE(bank_name, 'N/A'),
      COALESCE(bank_account_holder, 'N/A'),
      COALESCE(bank_account_number, 'N/A'),
      COALESCE(bank_account_type, 'monetary')
    INTO v_bank_name, v_bank_account_holder, v_bank_account_number, v_bank_account_type
    FROM public.user_financial_data
    WHERE user_id = _target_user_id
    ORDER BY updated_at DESC
    LIMIT 1;

    -- Use 'N/A' fallbacks if no financial data exists
    v_bank_name := COALESCE(v_bank_name, 'N/A');
    v_bank_account_holder := COALESCE(v_bank_account_holder, 'N/A');
    v_bank_account_number := COALESCE(v_bank_account_number, 'N/A');
    v_bank_account_type := COALESCE(v_bank_account_type, 'monetary');

    -- Build notes
    IF _notes IS NOT NULL THEN
      v_notes := _notes;
    ELSIF _is_paid THEN
      v_notes := 'Membresía Prime asignada por administrador. Referencia: ' || COALESCE(_payment_reference, 'N/A');
    ELSE
      v_notes := 'Membresía Prime asignada como cortesía administrativa';
    END IF;

    -- Insert into prime_memberships
    INSERT INTO public.prime_memberships (
      user_id,
      amount,
      status,
      approved_by,
      approved_at,
      expires_at,
      notes,
      bank_name,
      bank_account_holder,
      bank_account_number,
      bank_account_type
    ) VALUES (
      _target_user_id,
      CASE WHEN _is_paid THEN 200 ELSE 0 END,
      'approved',
      auth.uid(),
      NOW(),
      NOW() + INTERVAL '1 year',
      v_notes,
      v_bank_name,
      v_bank_account_holder,
      v_bank_account_number,
      v_bank_account_type
    );

    RAISE NOTICE 'Prime membership created for user % by admin %', _target_user_id, auth.uid();
  ELSE
    RAISE NOTICE 'User % already has an approved Prime membership', _target_user_id;
  END IF;
END;
$$;