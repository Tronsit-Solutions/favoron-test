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
  -- Generate month series
  month_series AS (
    SELECT generate_series(
      date_trunc('month', effective_start_date::timestamp),
      date_trunc('month', effective_end_date::timestamp),
      '1 month'::interval
    )::date AS month_start
  ),
  
  -- Pre-aggregate package stats by month
  -- Updated: Include all paid states for revenue calculation
  package_stats AS (
    SELECT 
      date_trunc('month', p.created_at::timestamp)::date AS month_start,
      COUNT(*) AS total_packages,
      COUNT(*) FILTER (WHERE p.status IN (
        'paid', 'pending_purchase', 'purchased', 'in_transit',
        'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office',
        'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed'
      )) AS completed_packages,
      -- Revenue from ALL paid packages (not just completed)
      COALESCE(SUM(
        COALESCE((p.quote->>'price')::numeric, 0) +
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ) FILTER (WHERE p.status IN (
        'paid', 'pending_purchase', 'purchased', 'in_transit',
        'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office',
        'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed'
      ) AND p.quote IS NOT NULL), 0) AS total_revenue,
      -- Tips paid to travelers (from paid packages)
      COALESCE(SUM(COALESCE((p.quote->>'price')::numeric, 0)) 
        FILTER (WHERE p.status IN (
          'paid', 'pending_purchase', 'purchased', 'in_transit',
          'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office',
          'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed'
        ) AND p.quote IS NOT NULL), 0) AS tips_paid,
      -- Favoron earnings (serviceFee + deliveryFee - discount from paid packages)
      COALESCE(SUM(
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ) FILTER (WHERE p.status IN (
        'paid', 'pending_purchase', 'purchased', 'in_transit',
        'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office',
        'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery', 'completed'
      ) AND p.quote IS NOT NULL), 0) AS favoron_earnings
    FROM packages p
    WHERE p.created_at >= effective_start_date
    GROUP BY date_trunc('month', p.created_at::timestamp)::date
  ),
  
  -- Status breakdown by month
  status_breakdown_raw AS (
    SELECT 
      date_trunc('month', p.created_at::timestamp)::date AS month_start,
      p.status,
      COUNT(*) AS status_count,
      COALESCE(SUM(
        COALESCE((p.quote->>'price')::numeric, 0) +
        COALESCE((p.quote->>'serviceFee')::numeric, 0) +
        COALESCE((p.quote->>'deliveryFee')::numeric, 0) -
        COALESCE((p.quote->>'discountAmount')::numeric, 0)
      ) FILTER (WHERE p.quote IS NOT NULL), 0) AS status_revenue
    FROM packages p
    WHERE p.created_at >= effective_start_date
    GROUP BY date_trunc('month', p.created_at::timestamp)::date, p.status
  ),
  
  status_breakdown_agg AS (
    SELECT 
      month_start,
      jsonb_object_agg(
        status,
        jsonb_build_object('count', status_count, 'revenue', ROUND(status_revenue, 2))
      ) AS status_breakdown
    FROM status_breakdown_raw
    GROUP BY month_start
  ),
  
  -- Top destinations by month
  destinations_raw AS (
    SELECT 
      date_trunc('month', p.created_at::timestamp)::date AS month_start,
      p.package_destination,
      COUNT(*) AS dest_count
    FROM packages p
    WHERE p.created_at >= effective_start_date AND p.package_destination IS NOT NULL
    GROUP BY date_trunc('month', p.created_at::timestamp)::date, p.package_destination
  ),
  
  destinations_agg AS (
    SELECT 
      month_start,
      jsonb_object_agg(package_destination, dest_count) AS top_destinations
    FROM destinations_raw
    GROUP BY month_start
  ),
  
  -- Top origins by month
  origins_raw AS (
    SELECT 
      date_trunc('month', p.created_at::timestamp)::date AS month_start,
      p.purchase_origin,
      COUNT(*) AS origin_count
    FROM packages p
    WHERE p.created_at >= effective_start_date AND p.purchase_origin IS NOT NULL
    GROUP BY date_trunc('month', p.created_at::timestamp)::date, p.purchase_origin
  ),
  
  origins_agg AS (
    SELECT 
      month_start,
      jsonb_object_agg(purchase_origin, origin_count) AS top_origins
    FROM origins_raw
    GROUP BY month_start
  ),
  
  -- Trip stats by month
  trip_stats AS (
    SELECT 
      date_trunc('month', t.created_at::timestamp)::date AS month_start,
      COUNT(*) AS total_trips,
      COUNT(*) FILTER (WHERE t.status IN ('approved', 'active')) AS active_trips
    FROM trips t
    WHERE t.created_at >= effective_start_date
    GROUP BY date_trunc('month', t.created_at::timestamp)::date
  ),
  
  -- User stats by month
  user_stats AS (
    SELECT 
      date_trunc('month', pr.created_at::timestamp)::date AS month_start,
      COUNT(*) AS new_users
    FROM profiles pr
    WHERE pr.created_at >= effective_start_date
    GROUP BY date_trunc('month', pr.created_at::timestamp)::date
  ),
  
  -- Combine all data
  monthly_data AS (
    SELECT 
      ms.month_start,
      to_char(ms.month_start, 'YYYY-MM') AS month,
      to_char(ms.month_start, 'Month YYYY') AS month_name,
      COALESCE(ps.total_packages, 0) AS total_packages,
      COALESCE(ps.completed_packages, 0) AS completed_packages,
      COALESCE(ts.total_trips, 0) AS total_trips,
      COALESCE(ts.active_trips, 0) AS active_trips,
      COALESCE(us.new_users, 0) AS new_users,
      COALESCE(ps.total_revenue, 0) AS total_revenue,
      COALESCE(ps.tips_paid, 0) AS tips_paid,
      COALESCE(ps.favoron_earnings, 0) AS favoron_earnings,
      COALESCE(sb.status_breakdown, '{}'::jsonb) AS status_breakdown,
      COALESCE(da.top_destinations, '{}'::jsonb) AS top_destinations,
      COALESCE(oa.top_origins, '{}'::jsonb) AS top_origins
    FROM month_series ms
    LEFT JOIN package_stats ps ON ms.month_start = ps.month_start
    LEFT JOIN trip_stats ts ON ms.month_start = ts.month_start
    LEFT JOIN user_stats us ON ms.month_start = us.month_start
    LEFT JOIN status_breakdown_agg sb ON ms.month_start = sb.month_start
    LEFT JOIN destinations_agg da ON ms.month_start = da.month_start
    LEFT JOIN origins_agg oa ON ms.month_start = oa.month_start
  )
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', md.month,
      'month_name', md.month_name,
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
      'average_package_value', CASE 
        WHEN md.completed_packages > 0 
        THEN ROUND(md.total_revenue / md.completed_packages, 2)
        ELSE 0 
      END,
      'tips_paid', ROUND(md.tips_paid, 2),
      'favoron_earnings', ROUND(md.favoron_earnings, 2),
      'status_breakdown', md.status_breakdown,
      'top_destinations', md.top_destinations,
      'top_origins', md.top_origins,
      'financial_metrics', jsonb_build_object(
        'gross_revenue', ROUND(md.total_revenue, 2),
        'net_revenue', ROUND(md.favoron_earnings, 2),
        'service_fees', ROUND(md.favoron_earnings, 2)
      )
    ) ORDER BY md.month_start DESC
  ) INTO result
  FROM monthly_data md;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;