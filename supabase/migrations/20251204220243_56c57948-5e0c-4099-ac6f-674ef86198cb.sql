-- Add referrer_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN referrer_name text;

COMMENT ON COLUMN profiles.referrer_name IS 'Nombre de quien refirió al usuario (opcional, solo cuando acquisition_source = friend_referral)';