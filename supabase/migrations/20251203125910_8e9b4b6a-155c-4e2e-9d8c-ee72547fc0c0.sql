-- Optimizar get_monthly_reports usando CTEs para evitar timeouts
-- En lugar de 7 subconsultas correlacionadas por mes, pre-agregar datos una sola vez

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

  WITH 
  -- Generar serie de meses
  month_series AS (
    SELECT generate_series(
      date_trunc('month', effective_start_date::timestamp),
      date_trunc('month', effective_end_date::timestamp),
      '1 month'::interval
    )::date AS month_start
  ),
  
  -- Pre-agregar estadísticas de paquetes por mes (UN solo escaneo de tabla)
  package_stats AS (
    SELECT 
      date_trunc('month', p.created_at::timestamp)::date AS month_start,
      COUNT(*) AS total_packages,
      COUNT(*) FILTER (WHERE p.status IN (
        'pending_purchase',
        'payment_confirmed',
        'purchased',
        'in_transit',
        'received_by_traveler',
        'pending_office_confirmation',
        'delivered_to_office',
        'completed'
      )) AS completed_packages,
      -- Revenue solo de paquetes completados/entregados
      COALESCE(SUM(
        COALESCE((p.quote->>'price')::numeric, 0) +
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ) FILTER (WHERE p.status IN ('completed', 'delivered_to_office') AND p.quote IS NOT NULL), 0) AS total_revenue,
      -- Tips pagados a viajeros
      COALESCE(SUM(COALESCE((p.quote->>'price')::numeric, 0)) 
        FILTER (WHERE p.status IN ('completed', 'delivered_to_office') AND p.quote IS NOT NULL), 0) AS tips_paid,
      -- Ganancias Favoron
      COALESCE(SUM(
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ) FILTER (WHERE p.status IN ('completed', 'delivered_to_office') AND p.quote IS NOT NULL), 0) AS favoron_earnings
    FROM packages p
    WHERE p.created_at >= effective_start_date
    GROUP BY date_trunc('month', p.created_at::timestamp)::date
  ),
  
  -- Pre-agregar estadísticas de viajes por mes (UN solo escaneo de tabla)
  trip_stats AS (
    SELECT 
      date_trunc('month', t.created_at::timestamp)::date AS month_start,
      COUNT(*) AS total_trips,
      COUNT(*) FILTER (WHERE t.status IN ('approved', 'active')) AS active_trips
    FROM trips t
    WHERE t.created_at >= effective_start_date
    GROUP BY date_trunc('month', t.created_at::timestamp)::date
  ),
  
  -- Pre-agregar estadísticas de usuarios por mes (UN solo escaneo de tabla)
  user_stats AS (
    SELECT 
      date_trunc('month', pr.created_at::timestamp)::date AS month_start,
      COUNT(*) AS new_users
    FROM profiles pr
    WHERE pr.created_at >= effective_start_date
    GROUP BY date_trunc('month', pr.created_at::timestamp)::date
  ),
  
  -- Combinar todo con JOINs simples
  monthly_data AS (
    SELECT 
      ms.month_start,
      to_char(ms.month_start, 'YYYY-MM') AS month_key,
      to_char(ms.month_start, 'Month YYYY') AS month_label,
      COALESCE(ps.total_packages, 0) AS total_packages,
      COALESCE(ps.completed_packages, 0) AS completed_packages,
      COALESCE(ts.total_trips, 0) AS total_trips,
      COALESCE(ts.active_trips, 0) AS active_trips,
      COALESCE(us.new_users, 0) AS new_users,
      COALESCE(ps.total_revenue, 0) AS total_revenue,
      COALESCE(ps.tips_paid, 0) AS tips_paid,
      COALESCE(ps.favoron_earnings, 0) AS favoron_earnings
    FROM month_series ms
    LEFT JOIN package_stats ps ON ms.month_start = ps.month_start
    LEFT JOIN trip_stats ts ON ms.month_start = ts.month_start
    LEFT JOIN user_stats us ON ms.month_start = us.month_start
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