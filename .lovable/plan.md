

## Fix: `useAdminTips` must also update `package_assignments`

### Problem
`saveProductTips` in `useAdminTips.tsx` writes `products_data` and `admin_assigned_tip` only to the `packages` table. Since the unified flow uses `package_assignments` as the source of truth for quotes, the per-product tips never reach the assignment rows. When `AdminActionsModal` generates quotes for each assignment, it reads `assignment.admin_assigned_tip` which still has the old value.

### Solution

**File: `src/hooks/useAdminTips.tsx`**

After updating the `packages` table (which stays as the "master copy" of products_data), also update ALL active `package_assignments` rows for that package:

1. Query `package_assignments` where `package_id = packageId` and `status IN ('pending', 'quote_sent')`
2. Update each row with:
   - `products_data = normalizedProducts`
   - `admin_assigned_tip = totalTip`
   - `updated_at = now()`
3. This ensures that when `AdminActionsModal` generates quotes per-assignment, it picks up the correct tip values

**File: `src/components/admin/ProductTipAssignmentModal.tsx`** — No changes needed; it already calls `saveProductTips` correctly.

**File: `src/components/admin/AdminActionsModal.tsx`** — No changes needed; it already reads `assignment.admin_assigned_tip` which will now be up-to-date.

### Scope
- Single file edit: `src/hooks/useAdminTips.tsx` — add ~10 lines after the package update to sync assignments

