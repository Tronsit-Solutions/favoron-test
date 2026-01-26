
# Plan: Corregir el Reporte de Crecimiento de Usuarios

## Problema Identificado
El reporte actual tiene dos problemas:
1. **Datos incorrectos**: La gráfica muestra diciembre 2025 con ~1400 usuarios acumulados, pero el dato real es **754**
2. **El límite de 10,000 filas** puede causar pérdida de datos en el futuro, pero actualmente solo hay 1,253 usuarios totales

El bug principal es que el cálculo acumulado solo es preciso para el **mes actual** (línea 173), pero los meses anteriores usan datos potencialmente incompletos.

## Datos Reales de la Base de Datos

| Mes | Nuevos Usuarios | Acumulado Correcto |
|-----|-----------------|-------------------|
| jul 25 | 11 | 11 |
| ago 25 | 50 | 61 |
| sep 25 | 151 | 212 |
| oct 25 | 109 | 321 |
| nov 25 | 116 | 437 |
| dic 25 | 317 | 754 |
| ene 26 | 499 | **1,253** |

## Solución Propuesta

### Cambio en `useDynamicReports.tsx`

1. **Usar consultas SQL agregadas por mes** en lugar de traer todos los usuarios y contar en cliente
2. Esto elimina el problema del límite de 10,000 filas y garantiza datos precisos

```text
// Nueva query que obtiene conteos por mes directamente desde la DB
const monthlyUserCounts = await supabase.rpc('get_monthly_user_counts', {
  start_date: startDate,
  end_date: endDate
});
```

**Alternativa sin crear RPC** (más simple):
- Usar `GROUP BY` con la función de Supabase directamente no es posible
- En su lugar, calcular acumulados correctamente usando el total exacto (`countsData.totalUsers`) y restando hacia atrás

### Lógica Corregida

```text
// Calcular acumulados de forma descendente desde el total conocido
let runningTotal = exactTotalUsers; // 1,253

// Iterar de más reciente a más antiguo
for (let i = 0; i < monthlyData.length; i++) {
  // Para el mes actual
  monthlyData[monthlyData.length - 1 - i].accumulatedUsers = runningTotal;
  runningTotal -= monthlyData[monthlyData.length - 1 - i].newUsers;
}
```

Esto garantiza que:
- Enero 2026 = 1,253 (total exacto)
- Diciembre 2025 = 1,253 - 499 = 754
- Noviembre 2025 = 754 - 317 = 437
- etc.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useDynamicReports.tsx` | Corregir cálculo de usuarios acumulados usando el total exacto y restando hacia atrás |

---

## Detalles Técnicos

### Cambio Específico en `useDynamicReports.tsx`

**Líneas 156-173** - Modificar el loop para:
1. Primero, calcular todos los `newUsers` por mes normalmente
2. Después del loop, recalcular `accumulatedUsers` desde el total conocido restando hacia atrás

```typescript
// Después de construir monthlyData con newUsers...

// Recalcular acumulados de forma precisa
let runningTotal = exactTotalUsers;
for (let i = monthlyData.length - 1; i >= 0; i--) {
  monthlyData[i].accumulatedUsers = runningTotal;
  runningTotal -= monthlyData[i].newUsers;
}
```

### Resultado Esperado

El gráfico mostrará:
- **ene 26**: 499 nuevos, 1,253 acumulados
- **dic 25**: 317 nuevos, 754 acumulados
- **nov 25**: 116 nuevos, 437 acumulados
- etc.

## Riesgo
**Bajo** - Solo afecta la visualización del reporte, no datos transaccionales.
