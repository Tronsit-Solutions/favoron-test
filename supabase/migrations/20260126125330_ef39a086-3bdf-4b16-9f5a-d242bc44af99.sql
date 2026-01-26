-- Función para conteo mensual de usuarios
CREATE OR REPLACE FUNCTION get_monthly_user_counts()
RETURNS TABLE(month text, user_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as user_count
  FROM profiles
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para conteo mensual de paquetes con status
CREATE OR REPLACE FUNCTION get_monthly_package_stats()
RETURNS TABLE(
  month text, 
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  cancelled_count bigint,
  gmv numeric,
  service_fee numeric,
  delivery_fee numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(p.created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE p.status IN ('completed', 'delivered_to_office'))::bigint as completed_count,
    COUNT(*) FILTER (WHERE p.status IN ('pending_approval', 'approved', 'matched', 'awaiting_quote', 'quote_pending'))::bigint as pending_count,
    COUNT(*) FILTER (WHERE p.status IN ('rejected', 'cancelled', 'admin_rejected'))::bigint as cancelled_count,
    COALESCE(SUM(
      CASE WHEN p.status IN ('completed', 'delivered_to_office') 
      THEN COALESCE((p.quote->>'totalPrice')::numeric, (p.quote->>'completePrice')::numeric, 0)
      ELSE 0 END
    ), 0) as gmv,
    COALESCE(SUM(
      CASE WHEN p.status IN ('completed', 'delivered_to_office')
      THEN COALESCE((p.quote->>'serviceFee')::numeric, 0)
      ELSE 0 END
    ), 0) as service_fee,
    COALESCE(SUM(
      CASE WHEN p.status IN ('completed', 'delivered_to_office')
      THEN COALESCE((p.quote->>'deliveryFee')::numeric, 0)
      ELSE 0 END
    ), 0) as delivery_fee
  FROM packages p
  GROUP BY TO_CHAR(p.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para conteo mensual de viajes con status
CREATE OR REPLACE FUNCTION get_monthly_trip_stats()
RETURNS TABLE(
  month text,
  total_count bigint,
  approved_count bigint,
  completed_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(t.created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE t.status IN ('approved', 'active', 'completed'))::bigint as approved_count,
    COUNT(*) FILTER (WHERE t.status = 'completed')::bigint as completed_count
  FROM trips t
  GROUP BY TO_CHAR(t.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;