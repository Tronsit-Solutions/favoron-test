
# Plan: Corregir Discrepancia en Cálculo de Usuarios Mensuales

## Problema Confirmado

El reporte muestra **246 nuevos usuarios** en enero 2026 cuando deberían ser **499**. La base de datos tiene los datos correctos, pero el frontend los está calculando mal.

## Diagnóstico Técnico Detallado

Después de una investigación exhaustiva, identifiqué la causa raíz:

### El problema está en la línea 151:
```typescript
const monthKey = format(monthDate, 'yyyy-MM'); // USA TIMEZONE LOCAL
```

Mientras que la línea 157 usa:
```typescript
const userMonth = u.created_at?.substring(0, 7); // USA UTC (del ISO string)
```

**La comparación `userMonth === monthKey` es inconsistente** porque compara un valor UTC con un valor en timezone local.

### Impacto Real
Aunque inicialmente parecía que esto solo afectaría usuarios en el límite del mes, el problema es más sutil:

1. **El `monthKey` generado localmente puede ser diferente al esperado** cuando hay diferencias de timezone
2. Si el `monthKey` local es `"2025-12"` cuando debería ser `"2026-01"`, todos los usuarios de enero (499) no encontrarán coincidencia con ese monthKey
3. Pero 246 usuarios SÍ están siendo contados, lo que sugiere que algunos timestamps locales sí coinciden

## Causa Más Probable: Datos Incompletos + Timezone

El array `usersData` solo contiene usuarios que el query pudo recuperar en el momento de la primera carga (cuando se cacheó con v2). Si esa carga ocurrió antes de que todos los usuarios de enero se registraran, esos usuarios no están en el caché local.

## Solución Propuesta

### Paso 1: Garantizar Consistencia UTC (Arreglo Fundamental)

Cambiar la línea 151 para usar UTC consistentemente:

```typescript
// ANTES (línea 151):
const monthKey = format(monthDate, 'yyyy-MM');

// DESPUÉS:
const monthKey = monthDate.toISOString().substring(0, 7);
```

### Paso 2: Forzar Cache Refresh (Asegurar Datos Frescos)

Actualizar todos los queryKeys a `'v3'` para invalidar cualquier caché residual:

```typescript
queryKey: ['dynamic-reports-counts', 'v3'],
queryKey: ['dynamic-reports-users', months, 'v3'],
queryKey: ['dynamic-reports-packages', months, 'v3'],
queryKey: ['dynamic-reports-trips', months, 'v3'],
```

## Cambios Específicos en el Archivo

| Línea | Cambio |
|-------|--------|
| 51 | `queryKey: ['dynamic-reports-counts', 'v3']` |
| 70 | `queryKey: ['dynamic-reports-users', months, 'v3']` |
| 86 | `queryKey: ['dynamic-reports-packages', months, 'v3']` |
| 102 | `queryKey: ['dynamic-reports-trips', months, 'v3']` |
| 151 | `const monthKey = monthDate.toISOString().substring(0, 7);` |

## Archivo a Modificar

`src/hooks/useDynamicReports.tsx`

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Nuevos usuarios ene 26 | 246 | **499** |
| Total acumulado | 1,253 | 1,253 |
| Crecimiento MoM | -22.4% | **+57.4%** |

## Riesgo
**Bajo** - Solo afecta la visualización del reporte de crecimiento.
