
-- 1) Drop the unused RPC that depends on the view
DROP FUNCTION IF EXISTS public.get_package_products() CASCADE;

-- 2) Drop the unused view
DROP VIEW IF EXISTS public.package_products_view;
