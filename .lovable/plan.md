

## Plan: Split package 840cd3c1 into two separate orders

### Current State
Package `840cd3c1-7686-48a7-be39-248985922051` has 2 products:
1. **Apple Watch Series 11 46mm** - $429, qty 1, online
2. **Apple Watch Series 11 42mm** - $399, qty 2, online

Status: `pending_approval`, user: `40c8ee4e`, no matched trip yet.

### Steps

1. **Create a new package** for the second product (Apple Watch 42mm) using a Supabase edge function with admin client, copying all shared fields (user_id, purchase_origin, package_destination, delivery_deadline, delivery_method, etc.) and setting its own `products_data` and `item_description`.

2. **Update the original package** to keep only the first product (Apple Watch 46mm), updating `products_data`, `item_description`, and `estimated_price` accordingly.

### Data for each package

**Package 1 (original, updated):**
- `item_description`: "Apple Watch Series 11"
- `estimated_price`: 429
- `products_data`: only the 46mm product

**Package 2 (new):**
- `item_description`: "Apple Watch Series 11 42mm"
- `estimated_price`: 798 (399 × 2)
- `products_data`: only the 42mm product
- All other fields copied from original

### Implementation
Deploy a temporary edge function `admin-split-package` that:
1. Updates the original package with product 1 only
2. Inserts a new package with product 2 only
3. Returns both package IDs

Then delete the edge function after success.

