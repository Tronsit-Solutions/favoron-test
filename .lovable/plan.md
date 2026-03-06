

## Alinear la gráfica de Crecimiento de Ingresos con la Tabla Resumen Financiera

### Diagnóstico

Consulté la base de datos directamente y encontré las causas raíz. Para marzo 2026:

- **Gráfica muestra**: Q793.50 (gross Q1020 - Q226.50 cancellaciones)
- **Tabla muestra**: ~Q1020 neto (cancelaciones se anulan: +sf y -sf)

Hay **3 diferencias fundamentales** entre la lógica de la gráfica y la tabla:

1. **Cancelaciones**: La tabla muestra paquetes cancelados-pero-pagados como ingreso positivo + contrapartida negativa = neto cero. La gráfica los resta del bruto, creando una deducción de Q226.50 que no existe en la tabla.

2. **Timezone de reembolsos**: La gráfica agrupa reembolsos por UTC (`substring(0,7)`). La tabla agrupa por zona Guatemala (`new Date()` en el browser). Un reembolso completado entre medianoche y 6am UTC aparecería en meses distintos.

3. **Membresías Prime**: La tabla las incluye como ingreso Favorón. La gráfica las ignora por completo.

### Cambios

**`src/hooks/useDynamicReports.tsx`**:
- Eliminar la query de `cancelledPaidPackages` y todo el procesamiento de `cancellationServiceFeeByMonth` (ya que en la tabla estas se anulan a cero)
- Cambiar el agrupamiento de reembolsos: en lugar de `toMonthKey(completed_at)` (UTC substring), convertir a Guatemala TZ (UTC-6) antes de extraer el mes
- Agregar una nueva query para obtener membresías Prime aprobadas por mes
- Incluir el monto de Prime en `netFavoronRevenue` de cada mes
- Remover las dependencias de `cancelledPaidPackages` del `useMemo`

**`src/components/admin/charts/ServiceFeeGrowthChart.tsx`**:
- Sin cambios necesarios (ya usa `netFavoronRevenue`)

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:
- Alinear la lógica del detalle: eliminar la sección de cancelaciones (ya que neto = 0) para que el desglose coincida con la barra
- Agregar sección de membresías Prime como líneas de ingreso
- Usar Guatemala TZ para filtrar reembolsos (en lugar de UTC)

### Resultado esperado

Para cualquier mes seleccionado:
- El valor de la barra en la gráfica = `Ingreso Favorón` total de la tabla para ese mes
- El detalle (Sheet) al hacer clic en la barra mostrará el mismo desglose que la tabla

