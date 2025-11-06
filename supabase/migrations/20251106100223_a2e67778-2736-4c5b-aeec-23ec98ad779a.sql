-- Add ban tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- Create index for faster ban checks
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(is_banned, banned_until) WHERE is_banned = true;

-- Function to sync ban status from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_ban_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile when auth.users banned_until changes
  UPDATE public.profiles
  SET 
    is_banned = (NEW.banned_until IS NOT NULL AND NEW.banned_until > NOW()),
    banned_until = NEW.banned_until,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync ban status (only if not already exists)
DROP TRIGGER IF EXISTS on_auth_user_ban_change ON auth.users;
CREATE TRIGGER on_auth_user_ban_change
  AFTER UPDATE OF banned_until ON auth.users
  FOR EACH ROW
  WHEN (OLD.banned_until IS DISTINCT FROM NEW.banned_until)
  EXECUTE FUNCTION public.sync_ban_status();

-- Function to log ban actions
CREATE OR REPLACE FUNCTION public.log_ban_action(
  _target_user_id UUID,
  _admin_id UUID,
  _action TEXT,
  _duration TEXT,
  _reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_actions (
    package_id,
    admin_id,
    action_type,
    action_details,
    metadata
  ) VALUES (
    NULL,
    _admin_id,
    _action,
    CONCAT('User ', _action, ': ', _duration, ' - Reason: ', COALESCE(_reason, 'No reason provided')),
    jsonb_build_object(
      'target_user_id', _target_user_id,
      'duration', _duration,
      'reason', _reason,
      'timestamp', NOW()
    )
  );
END;
$$;

-- Update RLS policies to block banned users
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with ban check
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  AND (
    is_banned = false 
    OR banned_until IS NULL 
    OR banned_until <= NOW()
  )
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id 
  AND (
    is_banned = false 
    OR banned_until IS NULL 
    OR banned_until <= NOW()
  )
);

-- Block banned users from packages
DROP POLICY IF EXISTS "Users can view their own packages" ON public.packages;
DROP POLICY IF EXISTS "Users can create packages" ON public.packages;

CREATE POLICY "Users can view their own packages"
ON public.packages
FOR SELECT
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_banned = false OR banned_until IS NULL OR banned_until <= NOW())
  )
);

CREATE POLICY "Users can create packages"
ON public.packages
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_banned = false OR banned_until IS NULL OR banned_until <= NOW())
  )
);

-- Block banned users from trips
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create trips" ON public.trips;

CREATE POLICY "Users can view their own trips"
ON public.trips
FOR SELECT
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_banned = false OR banned_until IS NULL OR banned_until <= NOW())
  )
);

CREATE POLICY "Users can create trips"
ON public.trips
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_banned = false OR banned_until IS NULL OR banned_until <= NOW())
  )
);

-- Function to check if user is banned (helper)
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT is_banned AND (banned_until IS NULL OR banned_until > NOW())
      FROM public.profiles
      WHERE id = _user_id
    ),
    false
  );
$$;