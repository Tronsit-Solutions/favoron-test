

## Corregir link del producto "estuche de kindle"

### Problema
El link del producto "estuche de kindle" en el pedido `fa770514` esta guardado sin protocolo: `amazon.com/-/es/gp/product/B0D9YJWVZG/...`. Aunque la funcion `normalizeProductUrl` deberia agregar `https://`, el navegador esta interpretando el link como ruta relativa del preview, resultando en una URL rota.

### Solucion
Actualizar el campo `products_data` del paquete para corregir el `itemLink` del segundo producto, agregandole `https://www.` al inicio.

### Detalle tecnico
- **Tabla**: `packages`
- **ID**: `fa770514-d585-46be-882d-04b5e70c404b`
- **Campo**: `products_data[1].itemLink`
- **Valor actual**: `amazon.com/-/es/gp/product/B0D9YJWVZG/ref=ox_sc_act_title_2?smid=A15WS6LMRQ88GU&psc=1`
- **Valor corregido**: `https://www.amazon.com/-/es/gp/product/B0D9YJWVZG/ref=ox_sc_act_title_2?smid=A15WS6LMRQ88GU&psc=1`

Se usara una migracion SQL con `jsonb_set` para actualizar solo ese elemento del arreglo JSON sin afectar los demas productos.

Adicionalmente, se revisara que la funcion `normalizeProductUrl` se este aplicando correctamente en todos los lugares donde se renderizan links de productos, para prevenir este problema en el futuro.
