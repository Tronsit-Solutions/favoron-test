

## Problem

When editing a package (solicitud) in the admin matching tab, the delivery deadline date picker calendar opens but clicks on dates don't register. The calendar is rendered inside a Dialog + ScrollArea, and the Popover portal gets blocked by the Dialog's overlay z-index.

## Root Cause

In `src/components/dashboard/EditPackageModal.tsx` (line 406), the `PopoverContent` doesn't have an explicit z-index. Since it's inside a Dialog (z-50), the popover content needs to be rendered above it.

## Fix

**File: `src/components/dashboard/EditPackageModal.tsx`** (line 406)

Change the PopoverContent to include a z-index that renders above the Dialog:

```tsx
<PopoverContent className="w-auto p-0 z-[60]" align="start">
```

This ensures the calendar popover appears above the Dialog overlay and accepts pointer events correctly. The calendar already has `pointer-events-auto` (line 412), so no other changes are needed.

