-- Crear función para generar reportes mensuales
CREATE OR REPLACE FUNCTION public.get_monthly_reports(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  period_year INT,
  period_month INT,
  month_name TEXT,
  total_packages BIGINT,
  total_trips BIGINT,
  successful_matches BIGINT,
  completed_deliveries BIGINT,
  pending_requests BIGINT,
  total_revenue DECIMAL,
  traveler_tips DECIMAL,
  favoron_revenue DECIMAL,
  average_ticket DECIMAL,
  gmv_total DECIMAL,
  packages_by_status JSONB,
  trips_by_status JSONB,
  top_destinations JSONB,
  top_origins JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      COUNT(CASE WHEN p.matched_trip_id IS NOT NULL THEN 1 END) as successful_matches,
      COUNT(CASE WHEN p.status IN ('delivered_to_office', 'received_by_traveler') THEN 1 END) as completed_deliveries,
      COUNT(CASE WHEN p.status NOT IN ('delivered_to_office', 'received_by_traveler', 'rejected') THEN 1 END) as pending_requests,
      
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
      ), 0) as gmv_total,
      
      -- Estadísticas por estado
      jsonb_object_agg(
        COALESCE(p.status, 'unknown'),
        COUNT(CASE WHEN p.status IS NOT NULL THEN 1 END)
      ) FILTER (WHERE p.status IS NOT NULL) as packages_by_status,
      
      -- Top destinos
      jsonb_object_agg(
        p.package_destination,
        COUNT(*)
      ) FILTER (WHERE p.package_destination IS NOT NULL) as top_destinations,
      
      -- Top orígenes
      jsonb_object_agg(
        p.purchase_origin,
        COUNT(*)
      ) FILTER (WHERE p.purchase_origin IS NOT NULL) as top_origins
      
    FROM packages p
    WHERE p.created_at >= start_date 
      AND p.created_at < end_date
    GROUP BY DATE_TRUNC('month', p.created_at)
  ),
  trip_stats AS (
    SELECT 
      DATE_TRUNC('month', t.created_at) as period_start,
      COUNT(*) as total_trips,
      jsonb_object_agg(
        COALESCE(t.status, 'unknown'),
        COUNT(CASE WHEN t.status IS NOT NULL THEN 1 END)
      ) FILTER (WHERE t.status IS NOT NULL) as trips_by_status
    FROM trips t
    WHERE t.created_at >= start_date 
      AND t.created_at < end_date
    GROUP BY DATE_TRUNC('month', t.created_at)
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
    COALESCE(ps.packages_by_status, '{}'::jsonb),
    COALESCE(ts.trips_by_status, '{}'::jsonb),
    COALESCE(ps.top_destinations, '{}'::jsonb),
    COALESCE(ps.top_origins, '{}'::jsonb)
  FROM monthly_data md
  LEFT JOIN package_stats ps ON md.period_start = ps.period_start
  LEFT JOIN trip_stats ts ON md.period_start = ts.period_start
  ORDER BY md.year DESC, md.month DESC;
END;
$$;

-- Crear índices simples para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages (created_at);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips (created_at);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages (status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip_id ON packages (matched_trip_id) WHERE matched_trip_id IS NOT NULL;