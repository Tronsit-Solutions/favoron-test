

## Split Order 8dae2158 into Two Packages

**Current order** (`8dae2158-9f91-4536-b98c-70f57dc58091`) has 4 products:
1. Mochila negra - $135
2. Mochila de cuero - $175
3. Mochila roja - $135
4. Guantes talla M - $36

**Split plan:**
- **Order A** (existing `8dae2158`): Products 1-2 (Mochila negra + Mochila de cuero) → $310
- **Order B** (new package): Products 3-4 (Mochila roja + Guantes talla M) → $171

### Operations

1. **Update existing package** `8dae2158`: Remove products 3-4 from `products_data`, update `estimated_price` to 310, update `item_description` to reflect 2 products.

2. **Insert new package**: Copy all fields from original (same user, destination, delivery address, delivery method, deadline, status, notes) but with only products 3-4, `estimated_price` = 171, and updated `item_description`.

Both packages will remain in `approved` status with no trip matched, same delivery address (San Juan Ostuncalco, Quetzaltenango), and same payment method.

