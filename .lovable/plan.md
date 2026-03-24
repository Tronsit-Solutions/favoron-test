

## Agregar botón de eliminar fila en tabla Archivo Banco

### Cambio — `src/components/admin/AdminBankFileTab.tsx`

1. **Nuevo estado** `hiddenIds` (`Set<string>`) para rastrear filas eliminadas visualmente (no se borran de la DB, solo se ocultan de la tabla y la descarga).

2. **Función `removeRow`**: Agrega el ID al `hiddenIds`, lo remueve de `selectedIds` y elimina de `editedRows`.

3. **Filtrar `pendingOrders`** por `hiddenIds` para que las filas eliminadas no aparezcan en la tabla ni en la descarga.

4. **Nueva columna** al final de cada fila con un botón/icono `Trash2` (de lucide-react) para eliminar la fila.

5. **Actualizar `toggleAll`** para considerar solo las filas visibles (no las ocultas).

### Archivo
- `src/components/admin/AdminBankFileTab.tsx`

