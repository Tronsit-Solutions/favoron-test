
# Plan: Etiquetar Pedidos de Devolución en Admin

## Objetivo
Agregar un badge visual "🔄 Devolución" para identificar fácilmente los pedidos que son devoluciones en la vista de aprobaciones del admin.

## Archivo: `src/components/admin/AdminApprovalsTab.tsx`

### Cambio 1: Helper function para detectar devoluciones (después de línea 154)

Agregar una función helper para detectar si un paquete es una devolución:

```typescript
// Helper function to check if package is a return
const isReturnPackage = (pkg: any): boolean => {
  // Check by delivery method
  if (pkg.delivery_method === 'return_dropoff' || pkg.delivery_method === 'return_pickup') {
    return true;
  }
  // Check by origin (Guatemala origin = reverse logistics)
  if (pkg.purchase_origin === 'Guatemala') {
    return true;
  }
  return false;
};
```

### Cambio 2: Agregar badge de devolución (líneas 235-239)

Modificar el header del paquete para mostrar un badge si es devolución:

```tsx
<h4 className={`font-medium text-sm sm:text-base break-words ${
  pkg.products_data?.[0]?.requestType === 'personal' ? 'text-blue-600 dark:text-blue-400' : ''
}`}>
  {pkg.item_description}
  {isReturnPackage(pkg) && (
    <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">
      🔄 Devolución
    </Badge>
  )}
</h4>
```

### Cambio 3: Actualizar método de entrega para devoluciones (líneas 257-261)

Modificar la lógica de renderizado del método de entrega:

```tsx
<p className="text-xs sm:text-sm text-muted-foreground break-words">
  Método de entrega: {pkg.delivery_method === 'delivery' 
    ? `🚚 Envío a domicilio (+Q${getDeliveryFee(pkg.delivery_method, pkg.profiles?.trust_level, (pkg.confirmed_delivery_address as any)?.cityArea)})` 
    : pkg.delivery_method === 'return_dropoff'
      ? '📦 Punto de devolución (UPS/FedEx)'
      : pkg.delivery_method === 'return_pickup'
        ? '🚛 Pickup por carrier'
        : '🏢 Recojo en zona 14'}
</p>
```

## Resultado Visual

| Tipo de Pedido | Apariencia |
|----------------|------------|
| Compra normal | Texto normal |
| Pedido personal | Texto azul |
| Devolución | Texto azul + Badge púrpura "🔄 Devolución" |

El badge púrpura permite identificar rápidamente las devoluciones en la lista de aprobaciones, mientras que el texto de método de entrega ahora muestra correctamente "Punto de devolución" o "Pickup por carrier" según corresponda.
