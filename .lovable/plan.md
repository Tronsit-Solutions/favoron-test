
# Plan: Agregar `to_country` al RPC `get_admin_trips_with_user`

## Problema Identificado

El RPC `get_admin_trips_with_user` que carga los viajes para el admin **no incluye** el campo `to_country`. Esto causa que la lógica de matching en `AdminMatchDialog.tsx` falle porque:

1. El código usa: `normalizeCountry(trip.to_country || trip.to_city)`
2. Como `to_country` es `undefined`, usa `to_city` (ej: "Miami")  
3. `normalizeCountry("Miami")` no normaliza a "usa" porque "Miami" no está en la lista de variantes de países
4. Por lo tanto, el filtro de destino falla y no muestra viajes

## Solución

### Modificar el RPC `get_admin_trips_with_user`

Agregar `t.to_country` al SELECT del RPC:

```sql
CREATE OR REPLACE FUNCTION public.get_admin_trips_with_user()
RETURNS TABLE (
  id uuid,
  from_city text,
  to_city text,
  from_country text,
  to_country text,          -- NUEVO
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
  available_space integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.from_city,
    t.to_city,
    t.from_country,
    t.to_country,            -- NUEVO
    t.arrival_date::text,
    t.delivery_date::text,
    t.first_day_packages::text,
    t.last_day_packages::text,
    t.delivery_method,
    t.messenger_pickup_info,
    t.package_receiving_address,
    t.status,
    t.created_at::text,
    t.updated_at::text,
    t.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone_number,
    p.username,
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
| Viajes Disponibles (0) | Viajes con destino USA correctamente filtrados |
| `trip.to_country = undefined` | `trip.to_country = "estados-unidos"` |
| Filtro compara "miami" ≠ "usa" | Filtro compara "usa" = "usa" ✅ |

## Alcance

- 1 migración SQL para actualizar el RPC
- No requiere cambios en el código frontend (ya usa `trip.to_country` con fallback)
