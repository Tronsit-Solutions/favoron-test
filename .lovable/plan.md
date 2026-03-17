

## Add "Recurrente ID" column to Financial Summary Table

### Change

**`src/components/admin/FinancialSummaryTable.tsx`** — Add a new column after "Método Pago" (or after "ID Pedido") showing the `recurrente_checkout_id` from the package. The data is already fetched in the query (line 95).

1. **Add `<TableHead>`** (after line 781, the "Método Pago" column):
   ```
   <TableHead>Recurrente ID</TableHead>
   ```

2. **Add `<TableCell>`** in the row rendering (after the payment method cell ~line 902):
   ```tsx
   <TableCell className="text-xs text-muted-foreground font-mono">
     {item.package.recurrente_checkout_id 
       ? item.package.recurrente_checkout_id.slice(0, 12) + '...' 
       : '-'}
   </TableCell>
   ```

This will display a truncated Recurrente checkout ID for card payments and "-" for bank transfers. The data is already available since the query selects `recurrente_checkout_id`.

