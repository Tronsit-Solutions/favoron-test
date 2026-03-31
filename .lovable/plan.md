

## Fix mobile overflow on shopper package cards

### Problem
The package cards overflow the screen width on mobile, making the chat button and 3-dot menu inaccessible (cut off on the right side).

### Root cause
The mobile layout (line 419) uses `flex w-full` but the action buttons inside use `w-full` which calculates based on the parent flex-1 container. The outer wrapper at line 377 has `pl-2` padding that adds to the total width, and the `CardHeader` content doesn't properly constrain its children within the viewport.

### Solution

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. **Add `overflow-hidden` to the outer wrapper** at line 377 and ensure it constrains to viewport width.
2. **Add `overflow-hidden` to the `CardHeader`** to prevent content from pushing beyond card bounds.
3. **Add `overflow-hidden` to the mobile flex container** (line 419) to contain children.
4. **Constrain the left content column** (line 421) with `overflow-hidden` so long product names or wide buttons don't push the right column (chat + menu) off-screen.
5. **Ensure action buttons container** (line 617) has `overflow-hidden` and proper width constraints.

Key changes:
- Line 377: `<div className="relative pt-2 pl-2">` → add `overflow-hidden max-w-full`
- Line 419: `<div className="flex w-full">` → add `overflow-hidden`
- Line 421: already has `min-w-0`, add `overflow-hidden`
- Line 617: `<div className="space-y-2 w-full max-w-full pl-5">` → add `overflow-hidden`

Single file change, CSS-only fixes.

