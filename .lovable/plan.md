

## Agregar pestaña "Archivo Banco" con descarga XLS

### Cambios

#### 1) `src/components/admin/AdminPaymentsUnifiedTab.tsx`
- Agregar tercera sub-pestaña "Archivo Banco" con icono `FileSpreadsheet`
- Ampliar `TabsList` a `grid-cols-3`
- Renderizar nuevo componente `AdminBankFileTab`

#### 2) Nuevo: `src/components/admin/AdminBankFileTab.tsx`
- Muestra tabla preview de órdenes de pago pendientes con checkboxes de selección
- Mapeo de columnas:
  - A: `bank_account_holder`
  - B: vacía
  - C: `bank_account_number`
  - D: `monetaria` → 1, `ahorros` → 2
  - E: 1 (fijo)
  - F: vacía
  - G/H: `"Tip " + trip_id` (8 chars)
  - I: `amount`
- Botón "Descargar XLS" genera archivo **.xls** usando SheetJS con `bookType: 'xls'`
- Sin headers en el archivo (solo datos, listo para el banco)
- Usa `usePaymentOrders()` para datos

### Archivos
- **Modificar**: `AdminPaymentsUnifiedTab.tsx`
- **Crear**: `AdminBankFileTab.tsx`

