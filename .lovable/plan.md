

## Agregar pestaña "Consolidado" en Flujo de Caja

### Qué se construye
Una nueva pestaña dentro del componente CashFlowTable que muestre **todos los movimientos (ingresos + egresos) en una sola tabla ordenada por fecha**, permitiendo ver cronológicamente cuándo entró dinero y cuándo salió.

### Diseño

La tabla consolidada tendrá estas columnas:
- **Fecha** — fecha del movimiento
- **Tipo** — Badge verde "Ingreso" o rojo "Egreso"
- **Persona** — nombre del shopper (ingreso) o viajero (egreso)
- **Descripción** — item del paquete (ingreso) o "Pago a viajero" (egreso)
- **Monto** — positivo verde para ingresos, negativo rojo para egresos
- **Método/Comprobante** — método de pago o recibo

Ordenada por fecha descendente (más reciente primero).

### Implementación

**Modificar `src/components/admin/CashFlowTable.tsx`**:

1. Agregar estado `activeView` con valores `"detail"` | `"consolidated"`
2. Agregar un `Tabs` interno debajo de los KPIs de resumen con dos pestañas: "Detalle" (vista actual de ingresos + egresos separados) y "Consolidado"
3. Crear un `consolidatedRows` memo que combine `filteredIncomeRows` y `expenseRows` en un array unificado con tipo `"income"` | `"expense"`, ordenado por fecha descendente
4. Renderizar la tabla consolidada cuando `activeView === "consolidated"`, mostrando cada fila con badge de tipo y colores según ingreso/egreso
5. Incluir las filas consolidadas en el export Excel como una hoja adicional "Consolidado"

### Detalle técnico
- Se reutilizan los mismos datos ya cargados (incomeRows, expenseRows) — sin queries adicionales
- El memo `consolidatedRows` mapea ambos arrays a una interfaz común `{ date, type, person, description, amount, paymentMethod?, receiptUrl? }` y ordena con `.sort()` por fecha
- Los filtros de mes y método de pago siguen aplicando igual

