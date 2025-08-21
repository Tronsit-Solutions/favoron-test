-- Fix JSON operator usage in create_payment_order_with_snapshot
CREATE OR REPLACE FUNCTION public.create_payment_order_with_snapshot(
  _traveler_id uuid,
  _trip_id uuid,
  _amount numeric,
  _bank_name text,
  _bank_account_holder text,
  _bank_account_number text,
  _bank_account_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_order_id UUID;
  packages_snapshot JSONB;
  admin_user_id UUID;
  traveler_name TEXT;
  amount_formatted TEXT;
BEGIN
  -- Capture packages snapshot for this trip (fix nested JSON operators)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'item_description', p.item_description,
      'estimated_price', p.estimated_price,
      'quote', p.quote,
      'status', p.status,
      'purchase_origin', p.purchase_origin,
      'package_destination', p.package_destination,
      'shopper_info', jsonb_build_object(
        'id', pr.id,
        'first_name', pr.first_name,
        'last_name', pr.last_name,
        'email', pr.email
      ),
      -- Use -> to access the intermediate JSON object, then ->> for the final text value
      'delivery_confirmed_at', p.office_delivery->'admin_confirmation'->>'confirmed_at',
      'traveler_confirmed_at', p.traveler_confirmation->>'confirmed_at'
    )
  ) INTO packages_snapshot
  FROM public.packages p
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.matched_trip_id = _trip_id
    AND p.status NOT IN ('rejected', 'cancelled');

  -- Create the payment order with historical data
  INSERT INTO public.payment_orders (
    traveler_id,
    trip_id,
    amount,
    bank_name,
    bank_account_holder,
    bank_account_number,
    bank_account_type,
    historical_packages
  )
  VALUES (
    _traveler_id,
    _trip_id,
    _amount,
    _bank_name,
    _bank_account_holder,
    _bank_account_number,
    _bank_account_type,
    packages_snapshot
  )
  RETURNING id INTO payment_order_id;

  -- Get traveler info for notifications
  SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
  FROM public.profiles
  WHERE id = _traveler_id;

  -- Format amount
  amount_formatted := '$' || TO_CHAR(_amount, 'FM999,999,999.00');

  -- Notify all admins
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '💰 Nueva solicitud de pago',
      CONCAT('Solicitud de pago de ', COALESCE(traveler_name, 'Usuario'), ' por ', amount_formatted, '. Banco: ', _bank_name),
      'payment',
      'high',
      '/admin/payments',
      jsonb_build_object(
        'payment_order_id', payment_order_id,
        'trip_id', _trip_id,
        'traveler_id', _traveler_id,
        'amount', _amount,
        'bank_name', _bank_name,
        'account_holder', _bank_account_holder
      )
    );
  END LOOP;

  RETURN payment_order_id;
END;
$function$;