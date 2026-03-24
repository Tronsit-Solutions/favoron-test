

## Renombrar columnas en tabla y archivo XLS

### Cambio — `src/components/admin/AdminBankFileTab.tsx`

Actualizar los nombres de las 9 columnas en dos lugares:

1. **Headers de la tabla UI** (TableHeader): Reemplazar los nombres actuales por:
   - A: "Nombre"
   - B: "Id Participante"
   - C: "Cuenta credito / debito"
   - D: "Tipo Cuenta"
   - E: "Moneda"
   - F: "Banco"
   - G: "Descripcion Corta"
   - H: "Adenda"
   - I: "Valor Q"

2. **Headers del archivo XLS** (array `headers` en `handleDownload`): Mismos nombres.

### Archivo
- `src/components/admin/AdminBankFileTab.tsx`

