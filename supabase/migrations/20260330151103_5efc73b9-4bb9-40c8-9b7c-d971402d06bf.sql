DROP FUNCTION IF EXISTS public.get_monthly_package_stats();

CREATE OR REPLACE FUNCTION public.get_monthly_package_stats()
RETURNS TABLE(
  month text,
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  cancelled_count bigint,
  gmv numeric,
  service_fee numeric,
  delivery_fee numeric,
  completed_product_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM') AS month,
    count(*)::bigint AS total_count,
    count(*) FILTER (WHERE p.status = 'completed')::bigint AS completed_count,
    count(*) FILTER (WHERE p.status IN (
      'pending_approval','approved','pending_match','matched',
      'pending_purchase','purchase_confirmed','shipped','in_transit',
      'received_by_traveler','pending_office_confirmation',
      'delivered_to_office','ready_for_pickup','ready_for_delivery',
      'out_for_delivery'
    ))::bigint AS pending_count,
    count(*) FILTER (WHERE p.status IN ('cancelled','archived_by_shopper','rejected'))::bigint AS cancelled_count,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','purchase_confirmed','shipped','in_transit',
        'received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery',
        'out_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'totalPrice')::numeric, 0)
      ELSE 0 END
    ), 0) AS gmv,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','purchase_confirmed','shipped','in_transit',
        'received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery',
        'out_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'serviceFee')::numeric, 0)
      ELSE 0 END
    ), 0) AS service_fee,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','purchase_confirmed','shipped','in_transit',
        'received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery',
        'out_for_delivery','completed'
      ) THEN COALESCE((p.quote->>'deliveryFee')::numeric, 0)
      ELSE 0 END
    ), 0) AS delivery_fee,
    COALESCE(SUM(
      CASE WHEN p.status IN (
        'pending_purchase','purchase_confirmed','shipped','in_transit',
        'received_by_traveler','pending_office_confirmation',
        'delivered_to_office','ready_for_pickup','ready_for_delivery',
        'out_for_delivery','completed'
      ) AND p.products_data IS NOT NULL
      THEN jsonb_array_length(p.products_data)
      ELSE 0 END
    ), 0)::bigint AS completed_product_count
  FROM packages p
  GROUP BY to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')
  ORDER BY month;
$$;