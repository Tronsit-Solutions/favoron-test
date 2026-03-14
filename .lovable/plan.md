

## Fix scroll in refund detail modal

### Problem
The `ScrollArea` inside the detail modal has `max-h-[calc(85vh-100px)]` but within a flex column layout, it doesn't get properly constrained — causing the content to overflow without scrolling.

### Fix

**`src/components/admin/AdminRefundsTab.tsx`** (line 289):

Change the ScrollArea from using `max-h` to using `flex-1 overflow-hidden min-h-0` so it properly fills the remaining space in the flex column and enables scrolling:

```tsx
// Before
<ScrollArea className="max-h-[calc(85vh-100px)] pr-4">

// After  
<ScrollArea className="flex-1 overflow-hidden min-h-0 pr-4">
```

The key is `min-h-0` — in a flex column, children default to `min-height: auto` which prevents them from shrinking below their content size. Setting `min-h-0` allows the ScrollArea to shrink and activate its internal scrollbar.

