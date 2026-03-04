

## One-time split: Apple Watch Series 11 42mm (Luis Coloma)

### Package details
- **ID**: `bec40b96-eece-41b6-b1cd-6317e9baa343`
- **Item**: Apple Watch Series 11 42mm, quantity 2, $798 total
- **Status**: approved

### What I'll do

Deploy a temporary edge function (using service role to bypass RLS INSERT restriction) that:

1. **Updates the original package**: sets quantity to 1, estimated_price to $399
2. **Creates a new package**: clones all fields (user_id, destination, deadline, delivery_method, status, etc.) with quantity 1 and price $399

### Why edge function
The `packages` INSERT RLS policy requires `user_id = auth.uid()`. Since the admin is creating a package on behalf of Luis Coloma, we need service role access. Following the established admin data-patching pattern with a temporary edge function.

### Cloned fields
- user_id, item_description, item_link, estimated_price ($399), purchase_origin, package_destination, package_destination_country, delivery_deadline, delivery_method, status, additional_notes, products_data (with quantity=1)

### Not cloned
- matched_trip_id, quote, payment_receipt, tracking_info, label_number, internal_notes

