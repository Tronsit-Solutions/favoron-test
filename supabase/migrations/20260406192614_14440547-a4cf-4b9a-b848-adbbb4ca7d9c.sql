
-- Composite index to speed up assignment aggregation by trip+status
CREATE INDEX IF NOT EXISTS idx_package_assignments_trip_status
  ON package_assignments (trip_id, status);

-- Additional index for trips by user+status (used in completed_trips count)
CREATE INDEX IF NOT EXISTS idx_trips_user_status
  ON trips (user_id, status);

-- RPC function: batch compute traveler performance stats server-side
CREATE OR REPLACE FUNCTION get_traveler_stats_batch(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  completed_trips bigint,
  delivered_packages bigint,
  assignments_responded bigint,
  assignments_no_response bigint,
  assignments_pending bigint,
  assignments_cancelled bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.uid AS user_id,
    COALESCE((SELECT count(*) FROM trips t
      WHERE t.user_id = u.uid AND t.status = 'completed_paid'), 0),
    COALESCE((SELECT count(*) FROM packages p
      JOIN trips t ON p.matched_trip_id = t.id
      WHERE t.user_id = u.uid
      AND p.status IN ('completed','completed_paid','delivered_to_office')), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND (pa.status IN ('bid_submitted','bid_won','bid_lost')
        OR (pa.status = 'bid_expired' AND pa.quote IS NOT NULL))), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_expired' AND pa.quote IS NULL), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_pending'), 0),
    COALESCE((SELECT count(*) FROM package_assignments pa
      JOIN trips t ON pa.trip_id = t.id
      WHERE t.user_id = u.uid
      AND pa.status = 'bid_cancelled'), 0)
  FROM unnest(p_user_ids) AS u(uid);
$$;
