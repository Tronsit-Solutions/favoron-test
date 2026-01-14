-- Add ui_preferences column to profiles table for storing UI preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ui_preferences jsonb DEFAULT '{"skip_package_intro": false}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.ui_preferences IS 'Stores user UI preferences like skip_package_intro, skip_trip_intro, etc.';