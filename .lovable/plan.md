

## Plan: Add label preview button to search results

### What
Add a label icon button to each package in the search tab. Clicking it opens the existing `PackageLabelModal` to preview/print the label.

### How

**File: `src/components/operations/OperationsSearchTab.tsx`**

1. Import `PackageLabelModal` and a `Tag` button (Tag icon already imported).
2. Add state for `selectedPackage` and `showLabelModal`.
3. Add a clickable Tag button next to each package's label number badge (or next to the price).
4. When clicked, map the `SearchResult` fields to the shape `PackageLabelModal` expects:
   - `id` → `package_id`
   - `item_description` → from `getProductNames()`
   - `products_data` → already available
   - `label_number` → already available
   - `status` → `package_status`
5. Render `PackageLabelModal` at the bottom of the component with the selected package.

The search result data already contains `products_data`, `label_number`, and all fields the label component needs. The modal handles label number generation if one doesn't exist yet.

