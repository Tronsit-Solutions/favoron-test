
# Plan: Corregir tipo de dato en RPC `get_admin_trips_with_user`

## Problema Identificado

El RPC `get_admin_trips_with_user` está fallando con error **"integer out of range"** porque:

1. La columna `available_space` en la tabla `trips` es de tipo `numeric`
2. En el RPC, se declaró como `integer`
3. Hay un valor en la base de datos (`12312323123123132000000`) que excede el máximo de un integer

## Solución

### Migración SQL

Actualizar el RPC cambiando `available_space integer` → `available_space numeric`:

```sql
DROP FUNCTION IF EXISTS public.get_admin_trips_with_user();

CREATE FUNCTION public.get_admin_trips_with_user()
RETURNS TABLE (
  id uuid,
  from_city text,
  to_city text,
  from_country text,
  to_country text,
  arrival_date text,
  delivery_date text,
  first_day_packages text,
  last_day_packages text,
  delivery_method text,
  messenger_pickup_info jsonb,
  package_receiving_address jsonb,
  status text,
  created_at text,
  updated_at text,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  username text,
  user_display_name text,
  available_space numeric  -- CAMBIADO de integer a numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id, t.from_city, t.to_city, t.from_country, t.to_country,
    t.arrival_date::text, t.delivery_date::text,
    t.first_day_packages::text, t.last_day_packages::text,
    t.delivery_method, t.messenger_pickup_info,
    t.package_receiving_address, t.status,
    t.created_at::text, t.updated_at::text, t.user_id,
    p.first_name, p.last_name, p.email, p.phone_number, p.username,
    CONCAT(p.first_name, ' ', p.last_name) as user_display_name,
    t.available_space
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.created_at DESC;
$$;
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Error: integer out of range | Viajes cargados correctamente |
| 0 viajes disponibles | Todos los viajes del sistema |

## Cambios Adicionales

- Actualizar `src/integrations/supabase/types.ts` para reflejar el cambio de tipo (`available_space: number` permanece igual en TypeScript)
