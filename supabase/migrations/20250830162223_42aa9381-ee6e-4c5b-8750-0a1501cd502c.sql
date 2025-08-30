-- Enable RLS on public_profiles and allow public SELECT safely
DO $$ BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.nspname = t.schemaname
    JOIN pg_catalog.pg_class rel ON rel.oid = (quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))::regclass
    JOIN pg_catalog.pg_policy pol ON pol.polrelid = rel.oid
    WHERE t.schemaname = 'public' AND t.tablename = 'public_profiles'
  ) THEN
    EXECUTE 'ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY';
  END IF;
EXCEPTION WHEN others THEN
  -- Table might already have RLS enabled or view properties differ; ensure it's enabled
  BEGIN
    EXECUTE 'ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- Drop existing public select policy if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_profiles' 
      AND policyname = 'Public can view public_profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view public_profiles" ON public.public_profiles';
  END IF;
END $$;

-- Allow SELECT for everyone on public_profiles (contains only non-sensitive fields)
CREATE POLICY "Public can view public_profiles"
ON public.public_profiles
FOR SELECT
USING (true);
