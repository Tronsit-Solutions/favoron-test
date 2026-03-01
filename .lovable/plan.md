

## Plan: Update package ee17afda to online purchase

### What needs to change
Update the `products_data` JSON in package `ee17afda-e244-4944-87f5-e4378e887b46` to change:
- `requestType`: from `"personal"` to `"online"`
- `itemLink`: set to `"https://www.amazon.com/Oura-Ring-Tracking-Wearable-Fitness/dp/B0D9WVSZ56"`
- Remove personal-order fields (`instructions`, `weight`, `productPhotos`) since it's now an online order

### Implementation
Create a temporary edge function `admin-update-package-data` to perform the UPDATE, call it with the new data, then delete the function.

**New products_data:**
```json
[{
  "itemDescription": "Oura ring 4",
  "estimatedPrice": "350",
  "itemLink": "https://www.amazon.com/Oura-Ring-Tracking-Wearable-Fitness/dp/B0D9WVSZ56",
  "quantity": "1",
  "requestType": "online",
  "additionalNotes": null
}]
```

**Steps:**
1. Create edge function `supabase/functions/admin-update-package-data/index.ts` to accept packageId + productsData and update the row
2. Deploy and call it with the updated data
3. Delete the edge function after confirming success

