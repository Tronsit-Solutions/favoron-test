-- Step 1: Clean up existing duplicate orders
WITH duplicate_orders AS (
  SELECT 
    traveler_id, 
    trip_id, 
    COUNT(*) as order_count,
    array_agg(id ORDER BY created_at ASC) as order_ids
  FROM payment_orders 
  WHERE status IN ('pending', 'completed')
  GROUP BY traveler_id, trip_id
  HAVING COUNT(*) > 1
)
UPDATE payment_orders 
SET status = 'cancelled',
    notes = 'Cancelled due to duplicate order - keeping most recent',
    updated_at = NOW()
WHERE id = ANY(
  SELECT unnest(order_ids[1:array_length(order_ids, 1)-1]) 
  FROM duplicate_orders
);

-- Step 2: Now create the unique index
CREATE UNIQUE INDEX idx_payment_orders_unique_active_per_trip 
ON payment_orders (traveler_id, trip_id) 
WHERE status IN ('pending', 'completed');

-- Step 3: Make the create_payment_order_with_snapshot function idempotent
CREATE OR REPLACE FUNCTION public.create_payment_order_with_snapshot(
  _traveler_id uuid,
  _trip_id uuid,
  _amount numeric,
  _bank_name text,
  _bank_account_holder text,
  _bank_account_number text,
  _bank_account_type text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_order_id uuid;
  new_order_id uuid;
  package_snapshot jsonb;
BEGIN
  -- Check if an active payment order already exists for this trip and traveler
  SELECT id INTO existing_order_id
  FROM payment_orders
  WHERE traveler_id = _traveler_id 
    AND trip_id = _trip_id 
    AND status IN ('pending', 'completed')
  LIMIT 1;
  
  -- If an active order exists, return its ID (idempotent behavior)
  IF existing_order_id IS NOT NULL THEN
    RAISE NOTICE 'Found existing active payment order: %', existing_order_id;
    RETURN existing_order_id;
  END IF;
  
  -- Capture snapshot of all packages for this trip delivered by this traveler
  SELECT jsonb_agg(
    jsonb_build_object(
      'package_id', p.id,
      'item_description', p.item_description,
      'quote', p.quote,
      'status', p.status,
      'delivery_confirmed_at', NOW(),
      'shopper_id', p.user_id
    )
  ) INTO package_snapshot
  FROM packages p
  WHERE p.matched_trip_id = _trip_id
    AND p.status IN ('delivered_to_office', 'completed', 'received_by_traveler')
    AND EXISTS (
      SELECT 1 FROM trips t 
      WHERE t.id = _trip_id AND t.user_id = _traveler_id
    );
  
  -- Create new payment order with package snapshot
  INSERT INTO payment_orders (
    traveler_id,
    trip_id,
    amount,
    bank_name,
    bank_account_holder,
    bank_account_number,
    bank_account_type,
    historical_packages,
    status
  ) VALUES (
    _traveler_id,
    _trip_id,
    _amount,
    _bank_name,
    _bank_account_holder,
    _bank_account_number,
    _bank_account_type,
    package_snapshot,
    'pending'
  ) RETURNING id INTO new_order_id;
  
  -- Atomically update the trip payment accumulator
  UPDATE trip_payment_accumulator
  SET payment_order_created = true,
      updated_at = NOW()
  WHERE trip_id = _trip_id 
    AND traveler_id = _traveler_id;
    
  RAISE NOTICE 'Created new payment order: %', new_order_id;
  RETURN new_order_id;
END;
$$;