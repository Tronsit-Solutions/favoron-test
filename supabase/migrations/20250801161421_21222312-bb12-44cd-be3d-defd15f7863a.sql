-- Actualizar la función get_monthly_reports para aceptar parámetros de fecha opcionales
CREATE OR REPLACE FUNCTION public.get_monthly_reports(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
 RETURNS TABLE(period_year integer, period_month integer, month_name text, total_packages bigint, total_trips bigint, successful_matches bigint, completed_deliveries bigint, pending_requests bigint, total_revenue numeric, traveler_tips numeric, favoron_revenue numeric, average_ticket numeric, gmv_total numeric, packages_by_status jsonb, trips_by_status jsonb, top_destinations jsonb, top_origins jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Si no se especifican fechas, usar un rango que incluya cualquier mes con datos
  IF start_date IS NULL THEN
    -- Obtener la fecha más antigua de paquetes o viajes
    SELECT LEAST(
      COALESCE((SELECT DATE_TRUNC('month', MIN(created_at))::date FROM packages), CURRENT_DATE),
      COALESCE((SELECT DATE_TRUNC('month', MIN(created_at))::date FROM trips), CURRENT_DATE)
    ) INTO start_date;
  END IF;
  
  IF end_date IS NULL THEN
    -- Obtener la fecha más reciente de paquetes o viajes, incluir el mes actual
    SELECT GREATEST(
      COALESCE((SELECT DATE_TRUNC('month', MAX(created_at))::date FROM packages), CURRENT_DATE),
      COALESCE((SELECT DATE_TRUNC('month', MAX(created_at))::date FROM trips), CURRENT_DATE)
    ) INTO end_date;
    -- Asegurar que incluya todo el mes más reciente
    end_date := DATE_TRUNC('month', end_date + INTERVAL '1 month')::date;
  ELSE
    -- Asegurar que el end_date incluya todo el mes seleccionado
    end_date := DATE_TRUNC('month', end_date + INTERVAL '1 month')::date;
  END IF;

  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', d.month) as period_start,
      EXTRACT(YEAR FROM d.month)::INT as year,
      EXTRACT(MONTH FROM d.month)::INT as month,
      TO_CHAR(d.month, 'Month YYYY') as month_display
    FROM generate_series(start_date::timestamp, end_date::timestamp, '1 month'::interval) d(month)
    WHERE d.month < end_date::timestamp -- Excluir el mes extra que agregamos
  ),
  package_stats AS (
    SELECT 
      DATE_TRUNC('month', packages.created_at) as period_start,
      COUNT(*) as total_packages,
      SUM(CASE WHEN packages.matched_trip_id IS NOT NULL THEN 1 ELSE 0 END) as successful_matches,
      SUM(CASE WHEN packages.status IN ('delivered_to_office', 'received_by_traveler', 'completed') THEN 1 ELSE 0 END) as completed_deliveries,
      SUM(CASE WHEN packages.status NOT IN ('delivered_to_office', 'received_by_traveler', 'completed', 'rejected') THEN 1 ELSE 0 END) as pending_requests,
      
      -- Métricas financieras
      COALESCE(SUM(
        CASE 
          WHEN packages.status IN ('delivered_to_office', 'received_by_traveler', 'completed') 
            AND packages.quote IS NOT NULL 
            AND (packages.quote->>'totalPrice') IS NOT NULL
            AND (packages.quote->>'totalPrice')::DECIMAL > 0
          THEN (packages.quote->>'totalPrice')::DECIMAL
          ELSE 0 
        END
      ), 0) as total_revenue,
      
      COALESCE(SUM(
        CASE 
          WHEN packages.status IN ('delivered_to_office', 'received_by_traveler', 'completed') 
            AND packages.quote IS NOT NULL 
            AND (packages.quote->>'price') IS NOT NULL
            AND (packages.quote->>'price')::DECIMAL > 0
          THEN (packages.quote->>'price')::DECIMAL
          ELSE 0 
        END
      ), 0) as traveler_tips,
      
      COALESCE(SUM(
        CASE 
          WHEN packages.status IN ('delivered_to_office', 'received_by_traveler', 'completed') 
            AND packages.quote IS NOT NULL 
            AND (packages.quote->>'price') IS NOT NULL
            AND (packages.quote->>'serviceFee') IS NOT NULL
            AND (packages.quote->>'price')::DECIMAL > 0
            AND (packages.quote->>'serviceFee')::DECIMAL > 0
          THEN ((packages.quote->>'price')::DECIMAL + (packages.quote->>'serviceFee')::DECIMAL) * 0.4
          ELSE 0 
        END
      ), 0) as favoron_revenue,
      
      COALESCE(SUM(
        CASE 
          WHEN packages.status IN ('delivered_to_office', 'received_by_traveler', 'completed') 
            AND packages.estimated_price IS NOT NULL
          THEN packages.estimated_price
          ELSE 0 
        END
      ), 0) as gmv_total
      
    FROM packages
    WHERE packages.created_at >= start_date::timestamp 
      AND packages.created_at < end_date::timestamp
    GROUP BY DATE_TRUNC('month', packages.created_at)
  ),
  package_status_counts AS (
    SELECT 
      DATE_TRUNC('month', packages.created_at) as period_start,
      jsonb_object_agg(
        COALESCE(packages.status, 'unknown'),
        status_count
      ) as packages_by_status
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        status,
        COUNT(*) as status_count
      FROM packages 
      WHERE created_at >= start_date::timestamp 
        AND created_at < end_date::timestamp
      GROUP BY DATE_TRUNC('month', created_at), status
    ) package_grouped
    GROUP BY package_grouped.period_start
  ),
  trip_stats AS (
    SELECT 
      DATE_TRUNC('month', trips.created_at) as period_start,
      COUNT(*) as total_trips
    FROM trips
    WHERE trips.created_at >= start_date::timestamp 
      AND trips.created_at < end_date::timestamp
    GROUP BY DATE_TRUNC('month', trips.created_at)
  ),
  trip_status_counts AS (
    SELECT 
      DATE_TRUNC('month', trips.created_at) as period_start,
      jsonb_object_agg(
        COALESCE(trips.status, 'unknown'),
        status_count
      ) as trips_by_status
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        status,
        COUNT(*) as status_count
      FROM trips 
      WHERE created_at >= start_date::timestamp 
        AND created_at < end_date::timestamp
      GROUP BY DATE_TRUNC('month', created_at), status
    ) trip_grouped
    GROUP BY trip_grouped.period_start
  ),
  destination_counts AS (
    SELECT 
      DATE_TRUNC('month', packages.created_at) as period_start,
      jsonb_object_agg(
        packages.package_destination,
        dest_count
      ) as top_destinations
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        package_destination,
        COUNT(*) as dest_count
      FROM packages 
      WHERE created_at >= start_date::timestamp 
        AND created_at < end_date::timestamp
        AND package_destination IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at), package_destination
    ) dest_grouped
    GROUP BY dest_grouped.period_start
  ),
  origin_counts AS (
    SELECT 
      DATE_TRUNC('month', packages.created_at) as period_start,
      jsonb_object_agg(
        packages.purchase_origin,
        origin_count
      ) as top_origins
    FROM (
      SELECT 
        DATE_TRUNC('month', created_at) as period_start,
        purchase_origin,
        COUNT(*) as origin_count
      FROM packages 
      WHERE created_at >= start_date::timestamp 
        AND created_at < end_date::timestamp
        AND purchase_origin IS NOT NULL
      GROUP BY DATE_TRUNC('month', created_at), purchase_origin
    ) origin_grouped
    GROUP BY origin_grouped.period_start
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
  -- Solo incluir meses que tengan al menos algunos datos
  WHERE (ps.total_packages > 0 OR ts.total_trips > 0)
  ORDER BY md.year DESC, md.month DESC;
END;
$function$;