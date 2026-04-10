

## Plan: Acelerar el proceso de matching

### Problema real

Cuando se ejecuta el RPC `assign_package_to_travelers`, el UPDATE a la tabla `packages` dispara **22 triggers**. Aunque varios tienen early returns para el status `matched`, hay 3 triggers que ejecutan trabajo pesado e innecesario durante el matching:

1. **`preserve_product_links_trigger`** (BEFORE, sin filtro de columna) -- Ejecuta `jsonb_agg` con subqueries sobre `products_data` en CADA update, incluso cuando `products_data` no cambió realmente
2. **`update_trip_status_on_package_update`** (AFTER) -- Llama a `are_all_trip_packages_delivered()` que **NO EXISTE**, cae en bloque `EXCEPTION` que crea y destruye un savepoint (muy costoso)
3. **`sync_legacy_product_fields`** y **`ensure_admin_tip_in_products`** -- Se activan porque el RPC siempre escribe `products_data` aunque no haya cambiado

Además, el RPC actualiza `products_data = COALESCE(_products_data, products_data)` **siempre**, lo que dispara triggers de columna innecesariamente.

### Solución (3 cambios)

#### 1. Migración SQL: Optimizar el RPC para evitar escribir columnas innecesarias

Modificar `assign_package_to_travelers` para que solo actualice `products_data` y `admin_assigned_tip` cuando realmente sean distintos del valor actual:

```sql
UPDATE packages SET
  status = 'matched',
  admin_assigned_tip = CASE 
    WHEN _admin_tip IS DISTINCT FROM admin_assigned_tip THEN _admin_tip 
    ELSE admin_assigned_tip END,
  traveler_dismissal = NULL,
  traveler_dismissed_at = NULL,
  products_data = CASE 
    WHEN _products_data IS NOT NULL AND _products_data IS DISTINCT FROM products_data 
    THEN _products_data 
    ELSE products_data END,
  updated_at = now()
WHERE id = _package_id;
```

Esto evita disparar los triggers de columna `products_data` y `admin_assigned_tip` cuando no hay cambios reales.

#### 2. Migración SQL: Agregar early return a `preserve_product_item_links`

```sql
-- Skip when products_data hasn't changed
IF TG_OP = 'UPDATE' AND NEW.products_data IS NOT DISTINCT FROM OLD.products_data THEN
  RETURN NEW;
END IF;
```

#### 3. Migración SQL: Reemplazar `update_trip_status_on_package_update` 

Eliminar la llamada a la función inexistente y el bloque EXCEPTION costoso:

```sql
CREATE OR REPLACE FUNCTION update_trip_status_on_package_update()
RETURNS trigger AS $$
BEGIN
  -- No-op: trip status is managed elsewhere
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 4. Cliente: Aumentar timeout de 12s a 25s

En `useDashboardActions.tsx`, cambiar `RPC_TIMEOUT_MS` de 12000 a 25000 para evitar cancelaciones prematuras que causan reintentos y posible lock contention.

### Impacto esperado

| Fuente | Antes | Después |
|--------|-------|---------|
| `preserve_product_links_trigger` jsonb_agg | ~100-500ms | 0ms (early return) |
| `update_trip_status` exception handler | ~50-200ms | 0ms (no-op) |
| `sync_legacy_fields` + `ensure_admin_tip` disparados sin cambio real | ~50-100ms | 0ms (no se disparan) |
| Timeouts prematuros → reintentos + lock contention | Potencialmente minutos | Eliminado |

### Archivos a modificar

- **Nueva migración SQL** -- 3 funciones: `assign_package_to_travelers`, `preserve_product_item_links`, `update_trip_status_on_package_update`
- **`src/hooks/useDashboardActions.tsx`** -- Línea 1307: `RPC_TIMEOUT_MS = 25000`

