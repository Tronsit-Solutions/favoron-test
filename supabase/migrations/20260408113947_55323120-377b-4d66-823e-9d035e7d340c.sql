
DROP FUNCTION IF EXISTS public.create_payment_order_with_snapshot(uuid, uuid, numeric, text, text, text, text);

CREATE FUNCTION public.create_payment_order_with_snapshot(
  _traveler_id uuid,
  _trip_id uuid,
  _amount numeric,
  _bank_name text,
  _bank_account_number text,
  _bank_account_holder text,
  _bank_account_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment_order_id uuid;
  _historical_packages jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'package_id', p.id,
      'item_description', p.item_description,
      'item_link', p.item_link,
      'status', p.status,
      'quote', p.quote,
      'products_data', p.products_data,
      'admin_assigned_tip', p.admin_assigned_tip
    )
  )
  INTO _historical_packages
  FROM packages p
  WHERE p.matched_trip_id = _trip_id
    AND p.status IN ('delivered_to_office', 'completed', 'received_by_traveler', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery')
    AND p.quote IS NOT NULL;

  INSERT INTO payment_orders (
    trip_id, traveler_id, amount, bank_name, bank_account_number,
    bank_account_holder, bank_account_type, historical_packages, status
  )
  VALUES (
    _trip_id, _traveler_id, _amount, _bank_name, _bank_account_number,
    _bank_account_holder, _bank_account_type,
    COALESCE(_historical_packages, '[]'::jsonb), 'pending'
  )
  RETURNING id INTO _payment_order_id;

  UPDATE trip_payment_accumulator
  SET payment_order_created = true, updated_at = now()
  WHERE trip_id = _trip_id AND traveler_id = _traveler_id;

  RETURN _payment_order_id;
END;
$$;

-- Backfill item_link into existing historical_packages
UPDATE payment_orders po
SET historical_packages = (
  SELECT jsonb_agg(
    elem || jsonb_build_object('item_link', COALESCE(p.item_link, ''))
  )
  FROM jsonb_array_elements(po.historical_packages) AS elem
  LEFT JOIN packages p ON p.id = (elem->>'package_id')::uuid
)
WHERE historical_packages IS NOT NULL
  AND historical_packages != '[]'::jsonb;
