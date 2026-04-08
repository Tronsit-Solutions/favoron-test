

## Agregar links de productos en Ordenes de Pago procesadas

### Problema
El snapshot de `historical_packages` que se guarda al crear una orden de pago **no incluye `item_link`** del paquete. Además, el modal de detalle (`PaymentOrderDetailModal`) no muestra enlaces a productos aunque estuvieran disponibles.

### Cambios

**1. Migración SQL — Actualizar el RPC `create_payment_order_with_snapshot`**
- Agregar `'item_link', p.item_link` al `jsonb_build_object` que construye el snapshot
- Esto asegura que futuras órdenes de pago capturen el link del producto

**2. Migración SQL — Backfill de `item_link` en órdenes existentes**
- UPDATE las órdenes de pago existentes para inyectar `item_link` desde la tabla `packages` usando el `package_id` que ya está en el snapshot
- Esto cubre las órdenes ya procesadas

**3. UI — Mostrar link en `PaymentOrderDetailModal.tsx`**
- En la sección de "Paquetes Transportados", agregar un enlace clickeable debajo de `item_description` cuando `pkg.item_link` exista
- También revisar `products_data` por si tiene links de productos individuales
- Usar icono `ExternalLink` (ya importado) con estilo discreto

### Detalle técnico

```sql
-- En el RPC, agregar item_link al snapshot:
'item_link', p.item_link,

-- Backfill existentes:
UPDATE payment_orders po
SET historical_packages = (
  SELECT jsonb_agg(
    elem || jsonb_build_object('item_link', COALESCE(p.item_link, ''))
  )
  FROM jsonb_array_elements(po.historical_packages) AS elem
  LEFT JOIN packages p ON p.id = (elem->>'package_id')::uuid
)
WHERE historical_packages IS NOT NULL
  AND historical_packages != '[]'::jsonb;
```

En el modal, debajo del `item_description`:
```tsx
{pkg.item_link && (
  <a href={pkg.item_link} target="_blank" rel="noopener noreferrer"
     className="text-xs text-blue-600 hover:underline flex items-center gap-1">
    <ExternalLink className="w-3 h-3" /> Ver producto
  </a>
)}
```

