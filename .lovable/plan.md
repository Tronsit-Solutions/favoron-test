

## Problem

The city Combobox dropdown opens with `z-50`, same as the Dialog overlay. This causes the dropdown items (like "Ciudad de Guatemala") to be visually on top but not receiving pointer events — clicks fall through to the "Fecha de llegada" button underneath.

## Fix

**File: `src/components/ui/combobox.tsx` (line 81)**

Change the `PopoverContent` z-index from `z-50` to `z-[60]` so it renders above the Dialog overlay and captures clicks correctly:

```tsx
// Before
<PopoverContent className="w-full p-0 z-50 bg-popover" align="start">

// After
<PopoverContent className="w-full p-0 z-[60] bg-popover" align="start">
```

This matches the existing pattern already used for date pickers inside dialogs in this project.

