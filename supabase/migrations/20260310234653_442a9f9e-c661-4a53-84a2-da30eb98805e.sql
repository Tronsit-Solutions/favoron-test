CREATE OR REPLACE FUNCTION public.submit_acquisition_survey(
  _source text,
  _referrer_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    acquisition_source = _source,
    acquisition_source_answered_at = now(),
    referrer_name = _referrer_name
  WHERE id = auth.uid()
    AND acquisition_source IS NULL;
END;
$$;