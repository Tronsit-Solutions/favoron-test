-- Drop the existing function first
DROP FUNCTION IF EXISTS get_monthly_reports(date, date);

-- Create the corrected function that properly references tables
CREATE OR REPLACE FUNCTION get_monthly_reports(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  effective_start_date date;
  effective_end_date date;
  result jsonb := '[]'::jsonb;
  month_data jsonb;
  current_month date;
BEGIN
  -- Calculate effective date range
  IF start_date IS NULL THEN
    effective_start_date := date_trunc('month', CURRENT_DATE - interval '6 months')::date;
  ELSE
    effective_start_date := date_trunc('month', start_date)::date;
  END IF;
  
  IF end_date IS NULL THEN
    effective_end_date := date_trunc('month', CURRENT_DATE)::date + interval '1 month' - interval '1 day';
  ELSE
    effective_end_date := date_trunc('month', end_date)::date + interval '1 month' - interval '1 day';
  END IF;

  -- Generate data for each month in the range
  current_month := effective_start_date;
  
  WHILE current_month <= effective_end_date LOOP
    WITH month_packages AS (
      SELECT 
        p.*,
        COALESCE((p.quote->>'totalPrice')::numeric, 0) as total_price,
        COALESCE(p.estimated_price, 0) as est_price
      FROM public.packages p
      WHERE date_trunc('month', p.created_at) = date_trunc('month', current_month)
    ),
    month_trips AS (
      SELECT *
      FROM public.trips t
      WHERE date_trunc('month', t.created_at) = date_trunc('month', current_month)
    ),
    status_counts AS (
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_price) as revenue
      FROM month_packages
      GROUP BY status
    ),
    destination_counts AS (
      SELECT 
        package_destination,
        COUNT(*) as count
      FROM month_packages
      GROUP BY package_destination
      ORDER BY count DESC
      LIMIT 5
    ),
    origin_counts AS (
      SELECT 
        purchase_origin,
        COUNT(*) as count
      FROM month_packages
      GROUP BY purchase_origin
      ORDER BY count DESC
      LIMIT 5
    )
    SELECT jsonb_build_object(
      'month', to_char(current_month, 'YYYY-MM'),
      'month_name', to_char(current_month, 'FMMonth YYYY'),
      'total_packages', COALESCE((SELECT COUNT(*) FROM month_packages), 0),
      'total_trips', COALESCE((SELECT COUNT(*) FROM month_trips), 0),
      'total_revenue', COALESCE((SELECT SUM(total_price) FROM month_packages), 0),
      'average_package_value', COALESCE((
        SELECT CASE 
          WHEN COUNT(*) > 0 THEN SUM(total_price) / COUNT(*)
          ELSE 0 
        END 
        FROM month_packages
      ), 0),
      'completion_rate', COALESCE((
        SELECT CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')))::numeric / COUNT(*) * 100
          ELSE 0 
        END
        FROM month_packages
      ), 0),
      'status_breakdown', COALESCE((
        SELECT jsonb_object_agg(status, jsonb_build_object('count', count, 'revenue', revenue))
        FROM status_counts
      ), '{}'::jsonb),
      'top_destinations', COALESCE((
        SELECT jsonb_object_agg(package_destination, count)
        FROM destination_counts
      ), '{}'::jsonb),
      'top_origins', COALESCE((
        SELECT jsonb_object_agg(purchase_origin, count)
        FROM origin_counts
      ), '{}'::jsonb),
      'financial_metrics', jsonb_build_object(
        'gross_revenue', COALESCE((SELECT SUM(total_price) FROM month_packages), 0),
        'net_revenue', COALESCE((SELECT SUM(total_price * 0.85) FROM month_packages), 0),
        'service_fees', COALESCE((SELECT SUM(total_price * 0.15) FROM month_packages), 0)
      )
    ) INTO month_data;
    
    result := result || month_data;
    current_month := current_month + interval '1 month';
  END LOOP;

  RETURN result;
END;
$$;