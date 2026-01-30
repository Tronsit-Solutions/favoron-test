
## Corregir condición para mostrar Guatemala en selector de origen

### Problema
El código actual usa `pkg?.request_type` que **no existe como columna** en la base de datos. El tipo de pedido (`personal` u `online`) está guardado dentro del campo JSONB `products_data[0].requestType`.

### Evidencia de la base de datos
```sql
SELECT products_data->0->>'requestType' as request_type FROM packages
-- Retorna: 'personal' o 'online'
```

### Solución
Cambiar la línea 1166 de `PackageDetailModal.tsx`:

**De:**
```typescript
{(pkg?.request_type === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
```

**A:**
```typescript
{((Array.isArray(pkg?.products_data) && pkg?.products_data[0]?.requestType === 'personal') ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
```

### Alternativa más limpia
Extraer el tipo de request al inicio del componente:

```typescript
// Cerca de la línea 158-159, después de definir 'pkg'
const packageRequestType = Array.isArray(pkg?.products_data) 
  ? (pkg?.products_data[0] as any)?.requestType 
  : 'online';
```

Y luego en el Select:
```typescript
{(packageRequestType === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
```

### Archivo a modificar
`src/components/admin/PackageDetailModal.tsx`

### Resultado esperado
- Pedidos personales: mostrarán Guatemala, Estados Unidos, España, México, Otro
- Compras online: mostrarán Estados Unidos, España, México, Otro (sin Guatemala)
