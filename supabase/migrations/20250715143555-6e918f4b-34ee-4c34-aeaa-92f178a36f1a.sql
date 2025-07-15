-- Corregir la función get_monthly_reports para arreglar el error de columnas
CREATE OR REPLACE FUNCTION public.get_monthly_reports(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
 RETURNS TABLE(period_year integer, period_month integer, month_name text, total_packages bigint, total_trips bigint, successful_matches bigint, completed_deliveries bigint, pending_requests bigint, total_revenue numeric, traveler_tips numeric, favoron_revenue numeric, average_ticket numeric, gmv_total numeric, packages_by_status jsonb, trips_by_status jsonb, top_destinations jsonb, top_origins jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Si no se especifican fechas, usar los últimos 12 meses
  IF start_date IS NULL THEN
    start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months');
  END IF;
  
  IF end_date IS NULL THEN
    end_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  END IF;

  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', d.month) as period_start,
      EXTRACT(YEAR FROM d.month)::INT as year,
      EXTRACT(MONTH FROM d.month)::INT as month,
      TO_CHAR(d.month, 'Month YYYY') as month_display
    FROM generate_series(start_date, end_date, '1 month'::interval) d(month)
  ),
  package_stats AS (
    SELECT 
      DATE_TRUNC('month', p.created_at) as period_start,
      COUNT(*) as total_packages,
      SUM(CASE WHEN p.matched_trip_id IS NOT NULL THEN 1 ELSE 0 END) as successful_matches,
      SUM(CASE WHEN p.status IN ('delivered_to_office', 'received_by_traveler') THEN 1 ELSE 0 END) as completed_deliveries,
      SUM(CASE WHEN p.status NOT IN ('delivered_to_office', 'received_by_traveler', 'rejected') THEN 1 ELSE 0 END) as pending_requests,
      
      -- Métricas financieras
      COALESCE(SUM(
        CASE 
          WHEN p.status IN ('delivered_to_office', 'received_by_traveler') 
            AND p.quote IS NOT NULL 
            AND (p.quote->>'totalPrice')::DECIMAL > 0
          THEN (p.quote->>'totalPrice')::DECIMAL
          ELSE 0 
        END
      ), 0) as total_revenue,
      
      COALESCE(SUM(
        CASE 
          WHEN p.status IN ('delivered_to_office', 'received_by_traveler') 
            AND p.quote IS NOT NULL 
            AND (p.quote->>'price')::DECIMAL > 0
          THEN (p.quote->>'price')::DECIMAL
          ELSE 0 
        END
      ), 0) as traveler_tips,
      
      COALESCE(SUM(
        CASE 
          WHEN p.status IN ('delivered_to_office', 'received_by_traveler') 
            AND p.quote IS NOT NULL 
            AND (p.quote->>'price')::DECIMAL > 0
            AND (p.quote->>'serviceFee')::DECIMAL > 0
          THEN ((p.quote->>'price')::DECIMAL + (p.quote->>'serviceFee')::DECIMAL) * 0.4
          ELSE 0 
        END
      ), 0) as favoron_revenue,
      
      COALESCE(SUM(
        CASE 
          WHEN p.status IN ('delivered_to_office', 'received_by_traveler') 
            AND p.estimated_price IS NOT NULL
          THEN p.estimated_price
          ELSE 0 
        END
      ), 0) as gmv_total
      
    FROM public.packages p
    WHERE p.created_at >= start_date 
      AND p.created_at < end_date
    GROUP BY DATE_TRUNC('month', p.created_at)
  ),
  package_status_counts AS (
    SELECT 
      DATE_TRUNC('month', p.created_at) as period_start,
      jsonb_object_agg(
        COALESCE(p.status, 'unknown'),
        status_count
      ) as packages_by_status
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        status,
        COUNT(*) as status_count
      FROM public.packages 
      WHERE created_at >= start_date 
        AND created_at < end_date
      GROUP BY DATE_TRUNC('month', created_at), status
    ) p
    GROUP BY p.period_start
  ),
  trip_stats AS (
    SELECT 
      DATE_TRUNC('month', t.created_at) as period_start,
      COUNT(*) as total_trips
    FROM public.trips t
    WHERE t.created_at >= start_date 
      AND t.created_at < end_date
    GROUP BY DATE_TRUNC('month', t.created_at)
  ),
  trip_status_counts AS (
    SELECT 
      DATE_TRUNC('month', t.created_at) as period_start,
      jsonb_object_agg(
        COALESCE(t.status, 'unknown'),
        status_count
      ) as trips_by_status
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        status,
        COUNT(*) as status_count
      FROM public.trips 
      WHERE created_at >= start_date 
        AND created_at < end_date
      GROUP BY DATE_TRUNC('month', created_at), status
    ) t
    GROUP BY t.period_start
  ),
  destination_counts AS (
    SELECT 
      DATE_TRUNC('month', p.created_at) as period_start,
      jsonb_object_agg(
        p.package_destination,
        dest_count
      ) as top_destinations
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        package_destination,
        COUNT(*) as dest_count
      FROM public.packages 
      WHERE created_at >= start_date 
        AND created_at < end_date
        AND package_destination IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at), package_destination
    ) p
    GROUP BY p.period_start
  ),
  origin_counts AS (
    SELECT 
      DATE_TRUNC('month', p.created_at) as period_start,
      jsonb_object_agg(
        p.purchase_origin,
        origin_count
      ) as top_origins
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        purchase_origin,
        COUNT(*) as origin_count
      FROM public.packages 
      WHERE created_at >= start_date 
        AND created_at < end_date
        AND purchase_origin IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at), purchase_origin
    ) p
    GROUP BY p.period_start
  )
  SELECT 
    md.year,
    md.month,
    md.month_display,
    COALESCE(ps.total_packages, 0),
    COALESCE(ts.total_trips, 0),
    COALESCE(ps.successful_matches, 0),
    COALESCE(ps.completed_deliveries, 0),
    COALESCE(ps.pending_requests, 0),
    COALESCE(ps.total_revenue, 0),
    COALESCE(ps.traveler_tips, 0),
    COALESCE(ps.favoron_revenue, 0),
    CASE 
      WHEN ps.completed_deliveries > 0 
      THEN ps.total_revenue / ps.completed_deliveries 
      ELSE 0 
    END as average_ticket,
    COALESCE(ps.gmv_total, 0),
    COALESCE(psc.packages_by_status, '{}'::jsonb),
    COALESCE(tsc.trips_by_status, '{}'::jsonb),
    COALESCE(dc.top_destinations, '{}'::jsonb),
    COALESCE(oc.top_origins, '{}'::jsonb)
  FROM monthly_data md
  LEFT JOIN package_stats ps ON md.period_start = ps.period_start
  LEFT JOIN trip_stats ts ON md.period_start = ts.period_start
  LEFT JOIN package_status_counts psc ON md.period_start = psc.period_start
  LEFT JOIN trip_status_counts tsc ON md.period_start = tsc.period_start
  LEFT JOIN destination_counts dc ON md.period_start = dc.period_start
  LEFT JOIN origin_counts oc ON md.period_start = oc.period_start
  ORDER BY md.year DESC, md.month DESC;
END;
$function$;