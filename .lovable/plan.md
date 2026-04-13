

## Plan: Agregar columna de WhatsApp al lado del nombre del shopper en tabla de Cancelados

### Cambios

**1. `src/hooks/useCancelledPackages.ts`**
- Agregar `country_code` al select de profiles (linea 88): `"id, first_name, last_name, phone_number, country_code"`
- Agregar `country_code` al profileMap (linea 80): `{ name: string; phone: string | null; country_code: string | null }`
- Mapear `country_code` en el forEach (linea 93)
- Pasar `country_code` al construir cada row como `user_country_code`
- Agregar `user_country_code` a la interfaz `CancelledPackageRow`

**2. `src/components/admin/cx/CancelledPackagesTable.tsx`**
- Agregar `<TableHead>WhatsApp</TableHead>` despues de la columna Shopper (linea 73)
- Agregar `<TableCell>` que muestre el numero formateado como `{country_code} {phone}`, con un link `href="https://wa.me/..."` para abrir WhatsApp directamente
- Quitar el telefono que actualmente se muestra debajo del nombre del shopper (lineas 96-98)

### Resultado
- Nueva columna "WhatsApp" con el numero completo y clickeable para abrir chat de WhatsApp
- El nombre del shopper queda limpio sin el telefono debajo

