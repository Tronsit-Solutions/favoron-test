

## Abrir detalle de ingresos al hacer clic en una barra de la gráfica

### Resumen

Al hacer clic en una barra del gráfico "Crecimiento de Ingresos", se abrirá un Sheet (panel lateral) mostrando el detalle financiero de ese mes: service fee bruto, deducciones por reembolsos, deducciones por cancelaciones, y el neto resultante, con una lista de los paquetes involucrados.

### Cambios

**1. `src/components/admin/charts/ServiceFeeGrowthChart.tsx`**
- Agregar estado para el mes seleccionado (`selectedMonth`)
- Agregar handler `onClick` en el `<Bar>` para capturar el mes clickeado
- Renderizar un `<Sheet>` que se abre cuando `selectedMonth` está definido

**2. Nuevo componente `src/components/admin/charts/RevenueDetailSheet.tsx`**
- Recibe el `month` (formato YYYY-MM) y un callback `onClose`
- Consulta los paquetes activos del mes (mismos 11 estados que la tabla financiera) agrupados por `created_at` en zona horaria Guatemala
- Consulta reembolsos completados del mes (por `completed_at`)
- Consulta cancelaciones pagadas sin reembolso del mes (por `updated_at`)
- Muestra:
  - Resumen: Service Fee Bruto, (-) Reembolsos, (-) Cancelaciones, = Neto
  - Tabla con cada paquete/reembolso/cancelación mostrando descripción, status, service fee, y tipo (ingreso/deducción)

**3. Pasar datos necesarios al componente**
- El `ServiceFeeGrowthChart` ya recibe `data` con `monthLabel` y `month`. El componente de detalle usará el `month` (YYYY-MM) para hacer sus propias queries a Supabase.

### Flujo de interacción
1. Usuario hace clic en barra → se guarda el `month` del datapoint
2. Se abre Sheet desde la derecha con el detalle
3. El Sheet hace queries independientes para mostrar el desglose exacto
4. Usuario cierra el Sheet con X o clic fuera

