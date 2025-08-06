-- Performance Advisor Recommendations: Add missing foreign key index and remove unused indexes

-- 1. Add missing foreign key index for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- 2. Remove unused indexes identified by Performance Advisor
-- Note: We're being conservative and only dropping indexes that are clearly unused
-- and not critical for application functionality

-- Drop unused indexes on profiles table
DROP INDEX IF EXISTS profiles_email_idx;
DROP INDEX IF EXISTS profiles_username_idx;

-- Drop unused indexes on trips table  
DROP INDEX IF EXISTS trips_status_idx;
DROP INDEX IF EXISTS trips_from_city_idx;
DROP INDEX IF EXISTS trips_to_city_idx;

-- Drop unused indexes on notifications table
DROP INDEX IF EXISTS notifications_type_idx;
DROP INDEX IF EXISTS notifications_read_idx;

-- Drop unused indexes on user_roles table
DROP INDEX IF EXISTS user_roles_role_idx;

-- Drop unused indexes on trip_payment_accumulator table
DROP INDEX IF EXISTS trip_payment_accumulator_trip_id_idx;
DROP INDEX IF EXISTS trip_payment_accumulator_traveler_id_idx;

-- Drop unused indexes on packages table
DROP INDEX IF EXISTS packages_status_idx;
DROP INDEX IF EXISTS packages_created_at_idx;