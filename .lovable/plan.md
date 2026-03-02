

## Problem

In `PackageDetailModal.tsx` line 1709, product links are rendered with `href={product.link}` **without** passing through `normalizeProductUrl()`. Links like `amazon.com/...` (without `https://`) get treated as relative paths by the browser, so they navigate to `lovable.app/amazon.com/...` instead of the actual Amazon page.

The package 3dfe0ceb has 3 of 4 links without `https://` prefix -- that's why they don't work.

## Fix

**File**: `src/components/admin/PackageDetailModal.tsx`

1. Import `normalizeProductUrl` from `@/lib/validators`
2. At line ~1709, change `href={product.link}` to `href={normalizeProductUrl(product.link) || product.link}`
3. Also wrap the conditional at line 1705 to use `normalizeProductUrl` so invalid links aren't shown

Also check `ProductQuickViewModal.tsx` and `ProductDetailModal.tsx` -- these already import `normalizeProductUrl` but should be verified for consistency.

