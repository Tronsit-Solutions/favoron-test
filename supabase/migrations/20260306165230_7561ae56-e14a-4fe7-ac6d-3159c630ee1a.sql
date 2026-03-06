
-- Update get_monthly_package_stats to use Guatemala timezone
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
      ) THEN COALESCE((p.quote->>'totalToPay')::numeric, 0)
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
    ), 0) AS delivery_fee
  FROM packages p
  GROUP BY to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')
  ORDER BY month;
$$;

-- Update get_monthly_user_counts to use Guatemala timezone
CREATE OR REPLACE FUNCTION public.get_monthly_user_counts()
RETURNS TABLE(month text, user_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM') AS month,
    count(*)::bigint AS user_count
  FROM profiles p
  GROUP BY to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')
  ORDER BY month;
$$;

-- Update get_monthly_trip_stats to use Guatemala timezone
CREATE OR REPLACE FUNCTION public.get_monthly_trip_stats()
RETURNS TABLE(month text, total_count bigint, approved_count bigint, completed_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(t.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM') AS month,
    count(*)::bigint AS total_count,
    count(*) FILTER (WHERE t.status IN ('approved','completed'))::bigint AS approved_count,
    count(*) FILTER (WHERE t.status = 'completed')::bigint AS completed_count
  FROM trips t
  GROUP BY to_char(t.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')
  ORDER BY month;
$$;
