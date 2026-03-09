

## Agregar columna "ID Pedido" a la Tabla Resumen Financiera

### Cambio
Agregar una columna "ID Pedido" que muestre el ID del paquete (truncado, estilo `font-mono`) entre "Fecha Pago" y "Shopper", tanto en la tabla como en la exportación Excel.

### Archivo: `src/components/admin/FinancialSummaryTable.tsx`

**1. Header de tabla (~línea 763):** Agregar `<TableHead>ID Pedido</TableHead>` después de "Fecha Pago".

**2. Celdas de tabla (~línea 798):** Después de la celda de `paymentDate`, agregar:
```tsx
<TableCell className="text-xs text-muted-foreground font-mono">
  {item.package.id.slice(0, 8)}...
</TableCell>
```

**3. Excel export (~línea 601):** Agregar `'ID Pedido': item.package.id` después de `'Fecha Pago'`. También en las filas de totales (~líneas 618, 636) agregar `'ID Pedido': ''`.

