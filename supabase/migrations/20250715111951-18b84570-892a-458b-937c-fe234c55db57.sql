-- ============================================
-- MIGRACIÓN DE OPTIMIZACIÓN PARA ESCALABILIDAD
-- ============================================

-- 1. AGREGAR ÍNDICES CRÍTICOS PARA RENDIMIENTO
-- Índices para package_messages (tabla que crecerá mucho)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_package_messages_package_id 
ON public.package_messages (package_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_package_messages_user_id 
ON public.package_messages (user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_package_messages_created_at 
ON public.package_messages (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_package_messages_package_created 
ON public.package_messages (package_id, created_at DESC);

-- Índices para packages (búsquedas frecuentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_created_at 
ON public.packages (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_delivery_deadline 
ON public.packages (delivery_deadline);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_status_created 
ON public.packages (status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_user_status 
ON public.packages (user_id, status);

-- Índices para trips (búsquedas por fechas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_departure_date 
ON public.trips (departure_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_arrival_date 
ON public.trips (arrival_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_departure 
ON public.trips (status, departure_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_from_to_cities 
ON public.trips (from_city, to_city);

-- 2. AGREGAR CAMPO EMAIL A PROFILES (CRÍTICO PARA BÚSQUEDAS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Índice para búsquedas por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
ON public.profiles (email);

-- 3. AGREGAR CONSTRAINTS PARA INTEGRIDAD DE DATOS
-- Constraint para status válidos en packages
ALTER TABLE public.packages 
ADD CONSTRAINT IF NOT EXISTS check_packages_status 
CHECK (status IN ('pending_approval', 'approved', 'quote_sent', 'quote_accepted', 'payment_pending', 'payment_confirmed', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled'));

-- Constraint para status válidos en trips
ALTER TABLE public.trips 
ADD CONSTRAINT IF NOT EXISTS check_trips_status 
CHECK (status IN ('pending_approval', 'approved', 'active', 'completed', 'cancelled'));

-- Constraint para message_type válidos
ALTER TABLE public.package_messages 
ADD CONSTRAINT IF NOT EXISTS check_message_type 
CHECK (message_type IN ('text', 'file_upload', 'system', 'status_update'));

-- Constraint para que delivery_deadline sea en el futuro
ALTER TABLE public.packages 
ADD CONSTRAINT IF NOT EXISTS check_delivery_deadline_future 
CHECK (delivery_deadline > created_at);

-- 4. OPTIMIZAR JSONB CON ÍNDICES GIN
-- Índices GIN para búsquedas eficientes en JSONB
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_quote_gin 
ON public.packages USING gin (quote);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_traveler_address_gin 
ON public.packages USING gin (traveler_address);

-- 5. FUNCIÓN PARA LIMPIEZA DE DATOS ANTIGUOS (ARCHIVADO)
CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archivar notificaciones leídas más antiguas que 30 días
  DELETE FROM public.notifications 
  WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Archivar mensajes de paquetes completados más antiguos que 90 días
  DELETE FROM public.package_messages 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND package_id IN (
      SELECT id FROM public.packages 
      WHERE status IN ('completed', 'cancelled')
        AND updated_at < NOW() - INTERVAL '90 days'
    );
    
  RAISE NOTICE 'Archivado de datos antiguos completado';
END;
$$;

-- 6. FUNCIÓN PARA ESTADÍSTICAS DE RENDIMIENTO
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;

-- 7. TRIGGERS PARA ACTUALIZAR ESTADÍSTICAS
CREATE OR REPLACE FUNCTION public.update_package_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar estadísticas cuando cambie el status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notificar cambio de status para análisis
    PERFORM pg_notify('package_status_changed', 
      json_build_object('package_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para packages
DROP TRIGGER IF EXISTS trigger_package_stats ON public.packages;
CREATE TRIGGER trigger_package_stats
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_package_stats();

-- 8. COMENTARIOS EN TABLAS PARA DOCUMENTACIÓN
COMMENT ON TABLE public.packages IS 'Tabla principal de paquetes - optimizada para escalabilidad';
COMMENT ON TABLE public.trips IS 'Tabla de viajes - índices optimizados para búsquedas por fechas';
COMMENT ON TABLE public.package_messages IS 'Tabla de mensajes - configurada para crecimiento alto';
COMMENT ON TABLE public.profiles IS 'Tabla de perfiles - incluye email para búsquedas';

-- 9. CONFIGURAR AUTOVACUUM PARA TABLAS DE ALTA ACTIVIDAD
ALTER TABLE public.package_messages SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE public.packages SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- 10. ÍNDICES PARCIALES PARA OPTIMIZACIÓN
-- Índice parcial para paquetes activos (más eficiente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_active_status 
ON public.packages (user_id, created_at DESC) 
WHERE status NOT IN ('completed', 'cancelled');

-- Índice parcial para trips activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_active_status 
ON public.trips (user_id, departure_date) 
WHERE status IN ('approved', 'active');

-- Índice parcial para notificaciones no leídas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON public.notifications (user_id, created_at DESC) 
WHERE read = false;