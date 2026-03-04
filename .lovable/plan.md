

## Fix: Product link not visible when name is too long

### Problem
In `AdminMatchDialog.tsx` line 758-761, the product description uses `truncate flex-1` which causes it to consume all horizontal space, hiding the "Ver" link button when the product name is long.

### Fix

**File: `src/components/admin/AdminMatchDialog.tsx` (~line 758-761)**

Change the layout so the description truncates properly while the link button never shrinks:

- Add `min-w-0` to the description span (allows `truncate` to work properly in flex)
- Add `shrink-0` to the link button wrapper so it's always visible

```tsx
// Before
<div className="flex items-center gap-2 text-sm">
  <span className="font-medium text-blue-900 truncate flex-1">
    {index + 1}. {product.itemDescription || ...}
  </span>
  // link button...

// After
<div className="flex items-center gap-2 text-sm">
  <span className="font-medium text-blue-900 truncate flex-1 min-w-0">
    {index + 1}. {product.itemDescription || ...}
  </span>
  // link button with shrink-0 wrapper...
```

And wrap the link/no-link output in a `<span className="shrink-0">` so it never gets hidden.

