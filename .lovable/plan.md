

## Fix: Normalize product links in ProductTipAssignmentModal

**File**: `src/components/admin/ProductTipAssignmentModal.tsx`

1. Import `normalizeProductUrl` from `@/lib/validators`
2. At line 220, change `href={product.itemLink}` to `href={normalizeProductUrl(product.itemLink) || product.itemLink}`

Same fix already applied to `PackageDetailModal.tsx` — just missing in this modal.

