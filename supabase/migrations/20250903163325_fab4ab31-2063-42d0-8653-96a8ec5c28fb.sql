
-- Ensure extensions schema exists (it already does in Supabase, but safe to include)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the pg_net extension from public to extensions
-- This does NOT drop objects; it just relocates the extension.
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- Optional: verify the http() function remains in extensions (no-op for migration)
-- SELECT n.nspname, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = 'http';
