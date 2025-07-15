-- ============================================
-- MIGRACIÓN DE OPTIMIZACIÓN PARA ESCALABILIDAD (CORREGIDA)
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

-- 3. OPTIMIZAR JSONB CON ÍNDICES GIN
-- Índices GIN para búsquedas eficientes en JSONB
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_quote_gin 
ON public.packages USING gin (quote);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_traveler_address_gin 
ON public.packages USING gin (traveler_address);

-- 4. ÍNDICES PARCIALES PARA OPTIMIZACIÓN
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