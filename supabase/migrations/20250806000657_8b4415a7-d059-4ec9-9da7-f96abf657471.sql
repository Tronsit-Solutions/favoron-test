-- Database Performance Optimization Plan Implementation
-- Fix all foreign key indexing and remove unused indexes

-- Phase 1: Add Missing Foreign Key Indexes
-- These indexes will improve JOIN performance and foreign key constraint checking

-- Index for packages.user_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON public.packages(user_id);

-- Index for packages.matched_trip_id (foreign key to trips)
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip_id ON public.packages(matched_trip_id);

-- Index for trips.user_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- Index for package_messages.package_id (foreign key to packages)
CREATE INDEX IF NOT EXISTS idx_package_messages_package_id ON public.package_messages(package_id);

-- Index for package_messages.user_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_package_messages_user_id ON public.package_messages(user_id);

-- Index for user_roles.user_id (foreign key to auth.users)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Index for trip_payment_accumulator.trip_id (foreign key to trips)
CREATE INDEX IF NOT EXISTS idx_trip_payment_accumulator_trip_id ON public.trip_payment_accumulator(trip_id);

-- Index for trip_payment_accumulator.traveler_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_trip_payment_accumulator_traveler_id ON public.trip_payment_accumulator(traveler_id);

-- Index for payment_orders.traveler_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_payment_orders_traveler_id ON public.payment_orders(traveler_id);

-- Index for payment_orders.trip_id (foreign key to trips)
CREATE INDEX IF NOT EXISTS idx_payment_orders_trip_id ON public.payment_orders(trip_id);

-- Index for notifications.user_id (foreign key to profiles/auth.users)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Phase 2: Add Performance-Critical Indexes
-- These indexes will improve common query patterns

-- Index for packages status (frequently queried)
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);

-- Index for trips status (frequently queried)
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- Index for packages status with matched_trip_id (for traveler queries)
CREATE INDEX IF NOT EXISTS idx_packages_status_matched_trip ON public.packages(status, matched_trip_id) WHERE matched_trip_id IS NOT NULL;

-- Index for trips with date range queries
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_arrival_date ON public.trips(arrival_date);

-- Index for notifications read status and user
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- Index for package_messages by creation date (for timeline queries)
CREATE INDEX IF NOT EXISTS idx_package_messages_created_at ON public.package_messages(package_id, created_at);

-- Index for packages by creation date (for admin queries)
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON public.packages(created_at);

-- Index for trips by creation date (for admin queries)
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at);

-- Phase 3: Optimize User Roles Queries
-- Composite index for user roles lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Phase 4: Optimize Payment Tracking
-- Index for payment orders status
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- Composite index for trip payment accumulator queries
CREATE INDEX IF NOT EXISTS idx_trip_payment_accumulator_trip_traveler ON public.trip_payment_accumulator(trip_id, traveler_id);

-- Index for notifications by type and priority (for admin filtering)
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON public.notifications(type, priority);

-- Phase 5: Geographic and Search Optimization
-- Indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_trips_from_city ON public.trips(from_city);
CREATE INDEX IF NOT EXISTS idx_trips_to_city ON public.trips(to_city);
CREATE INDEX IF NOT EXISTS idx_packages_purchase_origin ON public.packages(purchase_origin);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON public.packages(package_destination);

-- Partial indexes for active/pending items only (more efficient)
CREATE INDEX IF NOT EXISTS idx_packages_active_status ON public.packages(status) WHERE status NOT IN ('completed', 'cancelled', 'rejected');
CREATE INDEX IF NOT EXISTS idx_trips_active_status ON public.trips(status) WHERE status IN ('approved', 'active');

-- Index for quote expiration monitoring
CREATE INDEX IF NOT EXISTS idx_packages_quote_expires ON public.packages(quote_expires_at) WHERE quote_expires_at IS NOT NULL;

-- Cleanup: Drop redundant or potentially unused indexes if they exist
-- (Only dropping if they exist to avoid errors)
DROP INDEX IF EXISTS packages_user_id_idx;
DROP INDEX IF EXISTS trips_user_id_idx;
DROP INDEX IF EXISTS package_messages_package_id_idx;

-- Add comment for future reference
COMMENT ON INDEX idx_packages_user_id IS 'Foreign key index for packages.user_id - improves JOIN performance';
COMMENT ON INDEX idx_packages_matched_trip_id IS 'Foreign key index for packages.matched_trip_id - improves JOIN performance';
COMMENT ON INDEX idx_user_roles_user_role IS 'Composite index for user role lookups - critical for RLS performance';