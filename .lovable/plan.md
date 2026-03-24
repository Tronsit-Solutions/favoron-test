

## Agregar headers al archivo XLS

### Cambio

**Archivo: `src/components/admin/AdminBankFileTab.tsx`**

Insertar una fila de headers antes de los datos en el array que se pasa a `aoa_to_sheet`:

```ts
const headers = ["Titular", "", "Cuenta", "Tipo", "Código", "", "Referencia 1", "Referencia 2", "Monto"];

const rows = [headers, ...selected.map(order => [...])];
```

Solo se modifica la función `handleDownload`, líneas 51-63.

