-- Actualizar la función get_monthly_reports para incluir más estados en completion_rate
-- Ahora incluye todos los estados "pagados o más avanzados"

CREATE OR REPLACE FUNCTION public.get_monthly_reports(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  effective_start_date date;
  effective_end_date date;
BEGIN
  -- Verify admin access
  IF NOT verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Set default date range if not provided (last 12 months)
  effective_start_date := COALESCE(start_date, (CURRENT_DATE - INTERVAL '12 months')::date);
  effective_end_date := COALESCE(end_date, CURRENT_DATE);

  WITH month_series AS (
    SELECT generate_series(
      date_trunc('month', effective_start_date::timestamp),
      date_trunc('month', effective_end_date::timestamp),
      '1 month'::interval
    )::date AS month_start
  ),
  monthly_data AS (
    SELECT 
      ms.month_start,
      to_char(ms.month_start, 'YYYY-MM') AS month_key,
      to_char(ms.month_start, 'Month YYYY') AS month_label,
      
      -- Package counts
      (SELECT COUNT(*) FROM packages p 
       WHERE date_trunc('month', p.created_at::timestamp) = ms.month_start) AS total_packages,
      
      -- Completed packages (pagados o más avanzados - nueva definición)
      (SELECT COUNT(*) FROM packages p 
       WHERE date_trunc('month', p.created_at::timestamp) = ms.month_start
       AND p.status IN (
         'pending_purchase',
         'payment_confirmed',
         'purchased',
         'in_transit',
         'received_by_traveler',
         'pending_office_confirmation',
         'delivered_to_office',
         'completed'
       )) AS completed_packages,
      
      -- Trip counts
      (SELECT COUNT(*) FROM trips t 
       WHERE date_trunc('month', t.created_at::timestamp) = ms.month_start) AS total_trips,
      
      -- Active trips
      (SELECT COUNT(*) FROM trips t 
       WHERE date_trunc('month', t.created_at::timestamp) = ms.month_start
       AND t.status IN ('approved', 'active')) AS active_trips,
      
      -- New users
      (SELECT COUNT(*) FROM profiles pr 
       WHERE date_trunc('month', pr.created_at::timestamp) = ms.month_start) AS new_users,
      
      -- Financial data from completed packages (only actual completed/delivered for revenue)
      (SELECT COALESCE(SUM(
        COALESCE((p.quote->>'price')::numeric, 0) +
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ), 0)
       FROM packages p 
       WHERE date_trunc('month', p.created_at::timestamp) = ms.month_start
       AND p.status IN ('completed', 'delivered_to_office')
       AND p.quote IS NOT NULL) AS total_revenue,
      
      -- Tips paid to travelers
      (SELECT COALESCE(SUM(COALESCE((p.quote->>'price')::numeric, 0)), 0)
       FROM packages p 
       WHERE date_trunc('month', p.created_at::timestamp) = ms.month_start
       AND p.status IN ('completed', 'delivered_to_office')
       AND p.quote IS NOT NULL) AS tips_paid,
      
      -- Favoron earnings (service fees + delivery fees - discounts)
      (SELECT COALESCE(SUM(
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ), 0)
       FROM packages p 
       WHERE date_trunc('month', p.created_at::timestamp) = ms.month_start
       AND p.status IN ('completed', 'delivered_to_office')
       AND p.quote IS NOT NULL) AS favoron_earnings
       
    FROM month_series ms
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month_key', md.month_key,
      'month_label', md.month_label,
      'month_start', md.month_start,
      'total_packages', md.total_packages,
      'completed_packages', md.completed_packages,
      'completion_rate', CASE 
        WHEN md.total_packages > 0 
        THEN ROUND((md.completed_packages::numeric / md.total_packages::numeric) * 100, 1)
        ELSE 0 
      END,
      'total_trips', md.total_trips,
      'active_trips', md.active_trips,
      'new_users', md.new_users,
      'total_revenue', ROUND(md.total_revenue, 2),
      'tips_paid', ROUND(md.tips_paid, 2),
      'favoron_earnings', ROUND(md.favoron_earnings, 2)
    ) ORDER BY md.month_start DESC
  ) INTO result
  FROM monthly_data md;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;