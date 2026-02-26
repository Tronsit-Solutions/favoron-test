CREATE OR REPLACE FUNCTION public.get_monthly_package_stats()
RETURNS TABLE(
  month text,
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  cancelled_count bigint,
  gmv numeric,
  service_fee numeric,
  delivery_fee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(p.created_at, 'YYYY-MM') AS month,
    count(*)::bigint AS total_count,
    count(*) FILTER (WHERE p.status = 'completed')::bigint AS completed_count,
    count(*) FILTER (WHERE p.status IN ('pending_approval','quoted','quote_rejected','requote_requested'))::bigint AS pending_count,
    count(*) FILTER (WHERE p.status IN ('cancelled','rejected'))::bigint AS cancelled_count,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'total')::numeric, 0) ELSE 0 END
    ), 0) AS gmv,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'service_fee')::numeric, 0) ELSE 0 END
    ), 0) AS service_fee,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','payment_pending_approval','paid','payment_confirmed',
        'shipped','in_transit','received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'delivery_fee')::numeric, 0) ELSE 0 END
    ), 0) AS delivery_fee
  FROM packages p
  GROUP BY to_char(p.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$;