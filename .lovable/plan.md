

## Plan: Add Product to Package f502267e and Update Tips

### Current State
Package `f502267e-f51c-460d-b6ed-e67eaad951fb` has 2 products:
1. Cuchilla de corte para plotter casero — $12.99 — Tip Q25
2. Par de cuchillas corte plotter casero — $17.45 — Tip Q25

Total tip: Q50, no quote object set yet.

### What Needs to Happen

**Add a 3rd product** to `products_data` JSONB array:
- Description: "Brother ScanNCut DX Mat CADXMATSTD12, 12\" x 12\" Standard Tack Adhesive"
- Link: `https://a.co/d/05WoPEqc`
- Price: $25.99
- Tip: Q25
- Quantity: 1
- requestType: online

**Update package totals**:
- `admin_assigned_tip`: 75
- `quote`: `{ price: "75.00", serviceFee: "37.50", totalPrice: "112.50", manually_edited: true, edited_at: <now> }`

### Math Verification
- Trust level: basic → standard rate: 0.50
- Total tip: 25 + 25 + 25 = Q75
- Service fee: 75 × 0.50 = Q37.50
- Total: 75 + 37.50 = **Q112.50** ✓

### Implementation
Single UPDATE to `packages` table via the insert tool (data operation, not schema change):
- Set `products_data` to the 3-element array
- Set `admin_assigned_tip` to 75
- Set `quote` JSONB with price, serviceFee, totalPrice
- Set `updated_at` to now()

Also sync to any active `package_assignments` for this package (if any exist).

### Technical Detail
```sql
UPDATE packages SET
  products_data = '[
    {"itemDescription":"Cuchilla de corte para plotter casero","estimatedPrice":"12.99","itemLink":"https://a.co/d/0b1cyioo","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Par de cuchillas corte plotter casero","estimatedPrice":"17.45","itemLink":"https://a.co/d/037284q3","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null},
    {"itemDescription":"Brother ScanNCut DX Mat CADXMATSTD12, 12x12 Standard Tack Adhesive","estimatedPrice":"25.99","itemLink":"https://a.co/d/05WoPEqc","quantity":"1","adminAssignedTip":25,"requestType":"online","additionalNotes":null}
  ]'::jsonb,
  admin_assigned_tip = 75,
  quote = '{"price":"75.00","serviceFee":"37.50","totalPrice":"112.50","manually_edited":true}'::jsonb,
  updated_at = now()
WHERE id = 'f502267e-f51c-460d-b6ed-e67eaad951fb';
```

