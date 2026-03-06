

## Reordenar columnas en tabla de adquisición por canal

### Cambios en `src/components/admin/charts/AcquisitionChart.tsx` (líneas 170-206):

Nuevo orden de columnas en la tabla:
1. Canal
2. Usuarios
3. **Usuarios Monetizados** (nueva columna, usa `channel.monetizedUsers`)
4. Tasa Conversión
5. **Paquetes Pagados** (movida después de Tasa Conversión)
6. Service Fee
7. Revenue Total

Actualizar tanto los `<TableHead>` como los `<TableCell>` correspondientes.

