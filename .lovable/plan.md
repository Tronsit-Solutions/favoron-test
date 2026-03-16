

## Agregar 2 productos a la orden b4e4136a

### Datos actuales
- **Package:** `b4e4136a-3f44-4319-baf1-6e0420a63662`
- **Status:** `in_transit`
- **Producto actual:** Pantalón pierna curvada algodón tobillero, color azul, talla M — €45, tip: Q150

### Productos a agregar
1. **Cotton Curve Ankle Trousers** — BLACK, talla S — €39.90
   - Link: `https://www.uniqlo.com/es/en/products/E479699-000/00?colorDisplayCode=09&sizeDisplayCode=003`
2. **Polo Jumper (Short Sleeve, Colour Block)** — OFF WHITE, talla S — €29.90
   - Link: `https://www.uniqlo.com/es/en/products/E485224-000/00?colorDisplayCode=01&sizeDisplayCode=003`

### Cambios
- **UPDATE `packages`** vía insert tool:
  - `products_data`: Append 2 new product entries (sin tip asignado aún)
  - `item_description`: Actualizar para reflejar los 3 productos
  - `estimated_price`: Actualizar al total (45 + 39.90 + 29.90 = 114.80)

### SQL
```sql
UPDATE packages
SET 
  products_data = '[
    {"additionalNotes":null,"adminAssignedTip":150,"estimatedPrice":"45","itemDescription":"Pantalón pierna curvada algodón tobillero de Uniqlo, color azul en talla M.","itemLink":"https://www.uniqlo.com/es/es/products/E479699-000/00?colorDisplayCode=69&sizeDisplayCode=004","quantity":1,"requestType":"online"},
    {"additionalNotes":null,"adminAssignedTip":null,"estimatedPrice":"39.90","itemDescription":"Cotton Curve Ankle Trousers de Uniqlo, color negro en talla S.","itemLink":"https://www.uniqlo.com/es/en/products/E479699-000/00?colorDisplayCode=09&sizeDisplayCode=003","quantity":1,"requestType":"online"},
    {"additionalNotes":null,"adminAssignedTip":null,"estimatedPrice":"29.90","itemDescription":"Polo Jumper (Short Sleeve, Colour Block) de Uniqlo, color off white en talla S.","itemLink":"https://www.uniqlo.com/es/en/products/E485224-000/00?colorDisplayCode=01&sizeDisplayCode=003","quantity":1,"requestType":"online"}
  ]'::jsonb,
  item_description = 'Pantalón pierna curvada algodón tobillero (azul M) + Cotton Curve Ankle Trousers (negro S) + Polo Jumper Colour Block (off white S) de Uniqlo',
  estimated_price = 114.80,
  updated_at = now()
WHERE id = 'b4e4136a-3f44-4319-baf1-6e0420a63662';
```

No code changes needed — data-only operation via insert tool.

