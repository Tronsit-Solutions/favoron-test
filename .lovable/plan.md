

# Plan: Corregir Cálculo de Usuarios Nuevos Mensuales

## Problema Identificado

El gráfico muestra **246 usuarios nuevos** en enero 2026, pero la base de datos confirma que son **499**. 

### Causa Raíz
El problema tiene dos partes:

1. **Datos cacheados en el navegador**: React Query tiene un `staleTime` de 5 minutos, pero la data del usuario no se ha refrescado
2. **Inconsistencia de zona horaria**: El código usa funciones `date-fns` que operan en la zona horaria local del navegador, mientras que los timestamps de la DB están en UTC

El código actual:
```typescript
const monthStart = startOfMonth(monthDate); // Zona horaria LOCAL
const monthEnd = endOfMonth(monthDate);     // Zona horaria LOCAL

const monthUsers = usersData.filter(u => {
  const createdAt = new Date(u.created_at); // UTC convertido a LOCAL
  return createdAt >= monthStart && createdAt <= monthEnd;
});
```

Esto puede causar que usuarios creados cerca del límite del mes (00:00-06:00 UTC del día 1) sean asignados al mes anterior.

---

## Solución Propuesta

### Cambio 1: Usar UTC para comparaciones de fechas

Modificar `useDynamicReports.tsx` para usar funciones UTC de `date-fns-tz` o comparar directamente strings de fecha ISO:

```typescript
// En lugar de comparar objetos Date con timezone local,
// extraer solo la parte YYYY-MM del timestamp ISO

const monthUsers = usersData.filter(u => {
  // Extraer YYYY-MM del timestamp ISO (siempre UTC)
  const userMonth = u.created_at.substring(0, 7); // "2026-01"
  return userMonth === monthKey; // "2026-01"
});
```

Este enfoque:
- Es más simple y directo
- No depende de la zona horaria del navegador
- Coincide exactamente con cómo la base de datos almacena las fechas

### Cambio 2: Calcular newUsers usando el conteo exacto para el mes actual

Para el mes actual (enero 2026), el conteo de usuarios nuevos debe derivarse del total exacto:

```typescript
// El mes actual usa el delta exacto: totalUsers - usuariosHastaMesAnterior
const currentMonthNewUsers = exactTotalUsers - previousMonthAccumulated;
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useDynamicReports.tsx` | Cambiar filtrado de fechas para usar comparación de strings YYYY-MM en lugar de objetos Date |

---

## Cambio Específico

En las líneas 154-159, cambiar de:

```typescript
// Users for this month
const monthUsers = usersData.filter(u => {
  const createdAt = new Date(u.created_at);
  return createdAt >= monthStart && createdAt <= monthEnd;
});
const newUsers = monthUsers.length;
```

A:

```typescript
// Users for this month - use ISO string comparison for UTC consistency
const monthUsers = usersData.filter(u => {
  // Extract YYYY-MM from ISO timestamp to avoid timezone issues
  const userMonth = u.created_at?.substring(0, 7);
  return userMonth === monthKey;
});
const newUsers = monthUsers.length;
```

Aplicar el mismo patrón para packages y trips.

---

## Resultado Esperado

| Mes | Antes | Después |
|-----|-------|---------|
| ene 26 | 246 | **499** |
| dic 25 | ~317 | 317 |
| Total Acumulado | 1,253 | 1,253 |

---

## Riesgo
**Bajo** - Solo afecta la visualización del reporte, no datos transaccionales.

