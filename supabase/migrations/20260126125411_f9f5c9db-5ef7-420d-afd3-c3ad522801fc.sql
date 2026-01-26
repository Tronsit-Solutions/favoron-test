-- Fix search_path for the 3 new report functions
ALTER FUNCTION get_monthly_user_counts() SET search_path = public;
ALTER FUNCTION get_monthly_package_stats() SET search_path = public;
ALTER FUNCTION get_monthly_trip_stats() SET search_path = public;