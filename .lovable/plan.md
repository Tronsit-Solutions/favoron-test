

## Agregar reembolsos al Consolidado del Flujo de Caja

### Qué cambia
Agregar un tercer tipo de movimiento "Reembolso" (naranja) al consolidado, mostrando las devoluciones completadas junto a ingresos y egresos, ordenadas cronológicamente.

### Implementación — `src/components/admin/CashFlowTable.tsx`

**1. Nueva query: reembolsos completados**
- Agregar `useQuery` para `refund_orders` con `status = 'completed'`, filtrado por `completed_at` según el mes seleccionado
- Hacer join con `profiles` para obtener nombre del shopper
- Campos: id, amount, reason, completed_at, shopper_id, package_id, receipt_url, receipt_filename

**2. Agregar filas de reembolso al `consolidatedRows`**
- Mapear refunds a la interfaz común con `type: "refund"`, fecha = `completed_at`, persona = nombre del shopper, descripción = razón de cancelación
- Incluir en el spread junto a income y expense, mismo sort por fecha

**3. Actualizar KPIs**
- Agregar `totalRefunds` al cálculo
- Ajustar Balance Neto: `totalIncome - totalExpenses - totalRefunds`
- Opcionalmente mostrar un cuarto KPI card para reembolsos (naranja)

**4. UI del consolidado**
- Nuevo badge naranja "Reembolso" con icono `RotateCcw`
- Monto en naranja con signo negativo (`-Q...`)

**5. Excel export**
- Incluir filas de reembolso en la hoja "Consolidado"

### Archivos
- **Modificar**: `src/components/admin/CashFlowTable.tsx`

