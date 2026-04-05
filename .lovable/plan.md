

## Problema encontrado

El componente `PaymentReceiptUpload.tsx` sube archivos con la ruta `{user_id}/{package_id}_payment_receipt.{ext}`, pero la política RLS de storage espera que el **primer segmento** de la ruta sea el `package_id` (no el `user_id`).

La RLS hace:
```sql
WHERE p.id::text = (string_to_array(name, '/'))[1]
```

Pero el código genera:
```typescript
const filePath = `${user.id}/${fileName}`;  // user_id es el primer segmento
```

Resultado: la RLS no encuentra ningún paquete cuyo ID coincida con el `user_id`, y **bloquea la subida silenciosamente** (o con error). Los admins no tienen este problema porque tienen una excepción por rol.

## Solución

Cambiar la estructura del path en `PaymentReceiptUpload.tsx` (línea 84-85) para que el primer segmento sea el `package_id`:

```typescript
// Antes:
const fileName = `${pkg.id}_payment_receipt.${fileExt}`;
const filePath = `${user.id}/${fileName}`;

// Después:
const fileName = `payment_receipt_${Date.now()}.${fileExt}`;
const filePath = `${pkg.id}/${fileName}`;
```

Esto alinea la ruta del archivo con lo que la política RLS espera, permitiendo que los shoppers suban sus comprobantes.

## Archivo a modificar
- `src/components/dashboard/shopper/PaymentReceiptUpload.tsx` — líneas 83-85: cambiar la estructura del path de `{user_id}/{package_id}_receipt` a `{package_id}/{receipt_file}`.

## Resultado esperado
- Dominika (y todos los shoppers) podrán subir comprobantes de pago sin errores de RLS.
- La funcionalidad existente de admins no se ve afectada (ya tienen excepción por rol).

