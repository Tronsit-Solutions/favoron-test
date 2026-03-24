

## Celdas editables en la tabla de Archivo Banco

### Enfoque
Agregar un estado `editedRows` (un Map de `orderId → objeto con valores editados`) que permite sobreescribir cualquier celda antes de descargar. Cada celda se convierte en un `<Input>` inline que lee del estado editado o del valor original como fallback.

### Cambios — `src/components/admin/AdminBankFileTab.tsx`

1. **Nuevo estado**: `editedRows` — `Record<string, Record<string, any>>` donde las keys son el ID de la orden y los valores son objetos con las columnas editadas (holder, account, type, code, ref1, ref2, amount).

2. **Inicializar** `editedRows` cuando cargan las órdenes, mapeando cada orden a sus valores por defecto (holder, account number, tipo, "1", refs, monto).

3. **Reemplazar cada `<TableCell>` estático** por un `<Input>` sin bordes que muestra el valor del `editedRows` y actualiza el estado al cambiar. Las columnas B y F (vacías) también serán editables por si el usuario necesita agregar algo.

4. **`handleDownload`** lee de `editedRows` en vez de directamente de las órdenes, asegurando que los valores editados se exporten al XLS.

### Resultado
- Todas las celdas son editables inline con inputs transparentes
- Los cambios se reflejan inmediatamente en la descarga XLS
- No se persisten a la base de datos (solo para la sesión de descarga)

