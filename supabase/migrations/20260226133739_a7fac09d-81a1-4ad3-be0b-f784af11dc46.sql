CREATE OR REPLACE FUNCTION get_monthly_package_stats()
RETURNS TABLE(
  month text,
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  cancelled_count bigint,
  gmv numeric,
  service_fee numeric,
  delivery_fee numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(p.created_at, 'YYYY-MM') AS month,
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE p.status IN ('completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'))::bigint AS completed_count,
    COUNT(*) FILTER (WHERE p.status IN ('pending_approval', 'pending_purchase', 'payment_pending_approval', 'paid', 'payment_confirmed', 'shipped', 'in_transit', 'received_by_traveler', 'pending_office_confirmation'))::bigint AS pending_count,
    COUNT(*) FILTER (WHERE p.status IN ('cancelled', 'rejected'))::bigint AS cancelled_count,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'totalPrice')::numeric, (p.quote->>'total')::numeric, 0)
      ELSE 0 END
    ), 0) AS gmv,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'serviceFee')::numeric, (p.quote->>'service_fee')::numeric, 0)
      ELSE 0 END
    ), 0) AS service_fee,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'deliveryFee')::numeric, (p.quote->>'delivery_fee')::numeric, 0)
      ELSE 0 END
    ), 0) AS delivery_fee
  FROM packages p
  WHERE p.quote IS NOT NULL
  GROUP BY to_char(p.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;