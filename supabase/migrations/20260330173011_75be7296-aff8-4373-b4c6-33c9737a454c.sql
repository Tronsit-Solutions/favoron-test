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
    count(*) FILTER (WHERE p.status IN ('pending_purchase','purchased','in_transit','arrived','pending_delivery','delivered'))::bigint AS pending_count,
    count(*) FILTER (WHERE p.status = 'cancelled')::bigint AS cancelled_count,
    COALESCE(sum(COALESCE((p.quote->>'price')::numeric, 0)), 0) AS gmv,
    COALESCE(sum(COALESCE((p.quote->>'serviceFee')::numeric, 0)), 0) AS service_fee,
    COALESCE(sum(COALESCE((p.quote->>'deliveryFee')::numeric, 0)), 0) AS delivery_fee,
    COALESCE(sum(
      CASE WHEN p.status = 'completed' AND p.products_data IS NOT NULL
        THEN jsonb_array_length(p.products_data)
        ELSE 0
      END
    )::bigint, 0) AS completed_product_count
  FROM packages p
  WHERE p.status IN ('pending_purchase','purchased','in_transit','arrived','pending_delivery','delivered','completed')
    AND p.quote IS NOT NULL
  GROUP BY to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')
  ORDER BY month;
$$;