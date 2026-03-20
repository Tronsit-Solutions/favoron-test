

## Agregar filtro por Método de Pago en Flujo de Caja

### Cambio — `src/components/admin/CashFlowTable.tsx`

1. Nuevo estado: `const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")`

2. Agregar un `Select` al lado del selector de mes (línea ~163) con opciones: "Todos", "Tarjeta", "Transferencia"

3. Filtrar `incomeRows` con `useMemo` antes de renderizar:
   - `all` → sin filtro
   - `card` → solo `paymentMethod === "card"`
   - `bank_transfer` → solo `paymentMethod !== "card"`

4. Usar las filas filtradas para la tabla de ingresos y el cálculo de Total Ingresos / Balance Neto

