-- Create table for pre-calculated platform statistics
CREATE TABLE public.platform_stats_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users integer NOT NULL DEFAULT 0,
  total_trips integer NOT NULL DEFAULT 0,
  total_packages_completed integer NOT NULL DEFAULT 0,
  total_tips_distributed numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert initial values (current approximate stats + historical)
INSERT INTO platform_stats_snapshot (total_users, total_trips, total_packages_completed, total_tips_distributed)
VALUES (1255, 220, 520, 85000);

-- Enable RLS
ALTER TABLE platform_stats_snapshot ENABLE ROW LEVEL SECURITY;

-- Public read access (for landing page)
CREATE POLICY "Public read access for stats" ON platform_stats_snapshot
  FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update stats" ON platform_stats_snapshot
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Only admins can insert
CREATE POLICY "Admins can insert stats" ON platform_stats_snapshot
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Fast function to read cached stats (no heavy counts)
CREATE OR REPLACE FUNCTION get_cached_public_stats()
RETURNS TABLE(
  total_users integer,
  total_trips integer,
  total_packages_completed integer,
  total_tips_distributed numeric,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT total_users, total_trips, total_packages_completed, total_tips_distributed, updated_at
  FROM platform_stats_snapshot
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- Function to refresh stats (call monthly or manually)
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_users integer;
  v_trips integer;
  v_packages integer;
  v_tips numeric;
  v_historical_users integer := 188;
  v_historical_trips integer := 110;
  v_historical_packages integer := 202;
  v_historical_tips numeric := 30000;
  v_existing_id uuid;
BEGIN
  -- Count current statistics
  SELECT COUNT(*) INTO v_users FROM profiles;
  SELECT COUNT(*) INTO v_trips FROM trips;
  SELECT COUNT(*) INTO v_packages FROM packages WHERE status = 'completed';
  SELECT COALESCE(SUM((quote->>'traveler_tip')::numeric), 0) INTO v_tips 
  FROM packages WHERE status = 'completed' AND quote IS NOT NULL;
  
  -- Get existing row id
  SELECT id INTO v_existing_id FROM platform_stats_snapshot ORDER BY updated_at DESC LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing row
    UPDATE platform_stats_snapshot SET
      total_users = v_users + v_historical_users,
      total_trips = v_trips + v_historical_trips,
      total_packages_completed = v_packages + v_historical_packages,
      total_tips_distributed = v_tips + v_historical_tips,
      updated_at = now(),
      updated_by = auth.uid()
    WHERE id = v_existing_id;
  ELSE
    -- Insert new row
    INSERT INTO platform_stats_snapshot (total_users, total_trips, total_packages_completed, total_tips_distributed, updated_by)
    VALUES (
      v_users + v_historical_users,
      v_trips + v_historical_trips,
      v_packages + v_historical_packages,
      v_tips + v_historical_tips,
      auth.uid()
    );
  END IF;
END;
$$;