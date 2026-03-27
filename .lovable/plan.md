

## Crear pedido para Luisa Torres

### Datos confirmados
- **Shopper**: Luisa Torres (`df6ee4fc-5a96-4d27-8531-fce7bf6fcfb7`)
- **Producto**: Vineyard Vines Jersey Top
- **Link**: https://a.co/d/07tvn76A
- **Cantidad**: 2 unidades
- **Precio estimado**: $25 c/u = $50 total
- **Destino**: Guatemala Ciudad
- **Método de entrega**: Pickup en oficina

### Acción
Insertar un registro en la tabla `packages` con estos datos usando el insert tool:

```sql
INSERT INTO packages (
  user_id, item_description, item_link, estimated_price,
  products_data, purchase_origin, package_destination,
  package_destination_country, delivery_method, status,
  delivery_deadline
) VALUES (
  'df6ee4fc-5a96-4d27-8531-fce7bf6fcfb7',
  'Vineyard Vines Jersey Top (x2)',
  'https://a.co/d/07tvn76A',
  50,
  '[{"itemDescription":"Vineyard Vines Jersey Top","estimatedPrice":"25","quantity":"2","requestType":"online","itemLink":"https://a.co/d/07tvn76A"}]',
  'Estados Unidos',
  'Guatemala',
  'Guatemala',
  'pickup',
  'pending_approval',
  NOW() + INTERVAL '30 days'
);
```

Un solo INSERT, sin cambios de código ni migraciones.

