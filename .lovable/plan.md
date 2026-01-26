
# Plan: Usar Agregaciones SQL en Lugar de Fetch de Todos los Registros

## Problema Raíz Identificado

El query actual está limitado a **1000 filas** por el servidor de Supabase (`PGRST_MAX_ROWS`), independientemente del `.limit(10000)` especificado en el cliente.

Como los datos están ordenados de más antiguo a más reciente:
- Se traen los primeros 1000 usuarios (julio 2025 → parte de enero 2026)
- Los últimos 253 usuarios de enero 2026 NO se incluyen
- Solo 246 de los 499 usuarios de enero están en el dataset

## Solución: Agregación en el Servidor

En lugar de traer todos los registros y filtrar en el frontend, usaremos queries agregados que calculan los conteos directamente en la base de datos.

## Arquitectura Propuesta

```text
┌──────────────────────────────────────────────────────────────────┐
│                    ANTES (Problemático)                          │
├──────────────────────────────────────────────────────────────────┤
│  1. Fetch 10,000 rows (limitado a 1000 por servidor)             │
│  2. Filtrar en frontend por mes                                  │
│  3. Contar en JavaScript                                         │
│  → Resultado: Datos incompletos                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    DESPUÉS (Correcto)                            │
├──────────────────────────────────────────────────────────────────┤
│  1. Query SQL con GROUP BY mes                                   │
│  2. Devuelve conteos ya calculados                               │
│  3. No hay límite de filas (solo ~12 resultados)                 │
│  → Resultado: Datos completos y precisos                         │
└──────────────────────────────────────────────────────────────────┘
```

## Cambios en el Código

### Archivo: `src/hooks/useDynamicReports.tsx`

#### 1. Nuevo Query para Usuarios por Mes (líneas 68-82)

Reemplazar el query actual de usuarios:
```typescript
// ANTES: Fetch de filas individuales
const { data, error } = await supabase
  .from('profiles')
  .select('id, created_at')
  .order('created_at', { ascending: true })
  .limit(10000);

// DESPUÉS: Agregación SQL usando RPC o función view
const { data, error } = await supabase
  .rpc('get_monthly_user_counts');
```

#### 2. Crear RPC Function en Supabase (nueva migración)

```sql
CREATE OR REPLACE FUNCTION get_monthly_user_counts()
RETURNS TABLE(month text, user_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as user_count
  FROM profiles
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Similar para Packages y Trips

Crear funciones RPC para:
- `get_monthly_package_counts` - con desglose por status
- `get_monthly_trip_counts` - con desglose por status

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/XXXX_add_monthly_report_functions.sql` | Crear - 3 funciones RPC |
| `src/hooks/useDynamicReports.tsx` | Modificar - Usar RPC en lugar de fetch individual |

## Migración SQL Completa

```sql
-- Función para conteo mensual de usuarios
CREATE OR REPLACE FUNCTION get_monthly_user_counts()
RETURNS TABLE(month text, user_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as user_count
  FROM profiles
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para conteo mensual de paquetes con status
CREATE OR REPLACE FUNCTION get_monthly_package_stats()
RETURNS TABLE(
  month text, 
  total_count bigint,
  completed_count bigint,
  pending_count bigint,
  cancelled_count bigint,
  gmv numeric,
  service_fee numeric,
  delivery_fee numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered_to_office'))::bigint as completed_count,
    COUNT(*) FILTER (WHERE status IN ('pending_approval', 'approved', 'matched', 'awaiting_quote', 'quote_pending'))::bigint as pending_count,
    COUNT(*) FILTER (WHERE status IN ('rejected', 'cancelled', 'admin_rejected'))::bigint as cancelled_count,
    COALESCE(SUM(
      CASE WHEN status IN ('completed', 'delivered_to_office') 
      THEN COALESCE((quote->>'totalPrice')::numeric, (quote->>'completePrice')::numeric, 0)
      ELSE 0 END
    ), 0) as gmv,
    COALESCE(SUM(
      CASE WHEN status IN ('completed', 'delivered_to_office')
      THEN COALESCE((quote->>'serviceFee')::numeric, 0)
      ELSE 0 END
    ), 0) as service_fee,
    COALESCE(SUM(
      CASE WHEN status IN ('completed', 'delivered_to_office')
      THEN COALESCE((quote->>'deliveryFee')::numeric, 0)
      ELSE 0 END
    ), 0) as delivery_fee
  FROM packages
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para conteo mensual de viajes con status
CREATE OR REPLACE FUNCTION get_monthly_trip_stats()
RETURNS TABLE(
  month text,
  total_count bigint,
  approved_count bigint,
  completed_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE status IN ('approved', 'active', 'completed'))::bigint as approved_count,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint as completed_count
  FROM trips
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Actualización del Hook

El hook `useDynamicReports.tsx` usará estas funciones RPC para obtener datos agregados directamente, eliminando:
1. El límite de 1000 filas
2. El procesamiento de filtrado en el frontend
3. La inconsistencia de timezone

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Usuarios enero 2026 | 246 | **499** |
| Total acumulado | 1,253 | 1,253 |
| Filas transferidas | 1000 | ~12 (solo agregados) |
| Precisión | ~75% | **100%** |

## Riesgo
**Bajo** - Las funciones RPC son de solo lectura y no afectan datos existentes.
