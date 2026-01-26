

# Plan: Forzar Refresh de Datos del Reporte

## Problema Confirmado

El código de filtrado UTC está correcto, pero **React Query está sirviendo datos cacheados** porque los `queryKey` no han cambiado. El navegador tiene almacenado un dataset viejo con solo ~246 usuarios de enero.

## Solución

Agregar un sufijo de versión a todos los queryKeys para forzar peticiones frescas:

## Archivo a Modificar

`src/hooks/useDynamicReports.tsx`

## Cambios Específicos

| Línea | Antes | Después |
|-------|-------|---------|
| 51 | `queryKey: ['dynamic-reports-counts']` | `queryKey: ['dynamic-reports-counts', 'v2']` |
| 70 | `queryKey: ['dynamic-reports-users', months]` | `queryKey: ['dynamic-reports-users', months, 'v2']` |
| 86 | `queryKey: ['dynamic-reports-packages', months]` | `queryKey: ['dynamic-reports-packages', months, 'v2']` |
| 102 | `queryKey: ['dynamic-reports-trips', months]` | `queryKey: ['dynamic-reports-trips', months, 'v2']` |

## Por qué esto funciona

Cuando React Query ve un queryKey diferente (`['dynamic-reports-users', 12, 'v2']` en lugar de `['dynamic-reports-users', 12]`), lo trata como una consulta completamente nueva y hace fetch directo a la base de datos, ignorando cualquier caché anterior.

## Resultado Esperado

Después de aplicar el cambio y refrescar la página:
- Enero 2026 mostrará **499 usuarios nuevos**
- Total acumulado será **1,253**

## Riesgo
**Muy bajo** - Solo afecta el caché de reportes.

