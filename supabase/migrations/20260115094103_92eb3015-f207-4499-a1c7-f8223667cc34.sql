-- Fix search_path for the new functions
ALTER FUNCTION get_cached_public_stats() SET search_path = public;
ALTER FUNCTION refresh_platform_stats() SET search_path = public;