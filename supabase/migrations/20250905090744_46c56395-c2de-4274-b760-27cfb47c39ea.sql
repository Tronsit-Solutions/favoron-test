-- Tighten access to trips_with_user and add admin-only RPC
-- 1) Revoke direct read access on the view from public roles
REVOKE ALL ON TABLE public.trips_with_user FROM anon;
REVOKE ALL ON TABLE public.trips_with_user FROM authenticated;
REVOKE ALL ON TABLE public.trips_with_user FROM PUBLIC;

-- 2) Create an admin-only RPC to fetch the same data safely
CREATE OR REPLACE FUNCTION public.get_admin_trips_with_user()
RETURNS SETOF public.trips_with_user
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow only admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can access admin trips view';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.trips_with_user
  ORDER BY arrival_date ASC;
END;
$$;

-- 3) Grant execute privilege on the RPC to authenticated users (admins will pass the check)
GRANT EXECUTE ON FUNCTION public.get_admin_trips_with_user() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_trips_with_user() FROM anon;