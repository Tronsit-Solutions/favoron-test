

## Add Recurrente Payment ID to Excel Export

### Change

**`src/components/admin/FinancialSummaryTable.tsx`** — Add `'Recurrente Payment ID'` field to the export data objects:

1. **Data rows** (~line 622): Add after `'Pago Mensajero (Q)'`:
   ```
   'Recurrente Payment ID': item.package?.recurrente_payment_id || '-',
   ```

2. **Totals row** (~line 639): Add empty value:
   ```
   'Recurrente Payment ID': '',
   ```

3. **Refunds totals row** (~line 659): Add empty value:
   ```
   'Recurrente Payment ID': '',
   ```

This ensures the exported Excel matches the table's last column.

