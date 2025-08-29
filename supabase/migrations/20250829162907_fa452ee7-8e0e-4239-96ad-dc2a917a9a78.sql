
-- 1) Endurecer vista package_products_view para respetar RLS de tablas base y restringir accesos directos

do $$
begin
  -- Asegurar que la vista exista antes de configurar opciones
  if exists (
    select 1
    from pg_catalog.pg_views
    where schemaname = 'public' and viewname = 'package_products_view'
  ) then
    -- Forzar ejecución con privilegios del invocador (RLS de tablas base se aplica)
    execute 'alter view public.package_products_view set (security_invoker = on)';
    -- Evitar filtraciones mediante funciones (seguridad de barrera)
    execute 'alter view public.package_products_view set (security_barrier = on)';

    -- Restringir permisos
    -- Quitar cualquier permiso heredado
    execute 'revoke all on public.package_products_view from public';
    execute 'revoke all on public.package_products_view from anon';
    -- Otorgar solo lo necesario
    execute 'grant select on public.package_products_view to authenticated';
    execute 'grant select on public.package_products_view to service_role';

    -- Comentario documental
    execute $$comment on view public.package_products_view is
      'Secure view over packages.products_data. Grants limited to authenticated and service_role. Base table RLS (packages) enforces row-level visibility.'$$;
  else
    raise notice 'View public.package_products_view not found; nothing to harden.';
  end if;
end
$$;
