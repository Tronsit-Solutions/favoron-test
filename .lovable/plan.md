

## Plan: Fix scroll in combobox dropdown

### Problem
The city selector dropdown (Combobox) cannot scroll on mobile. The `CommandList` has `overflow-y-auto` but mobile touch scrolling is blocked, likely due to missing `-webkit-overflow-scrolling: touch` and `touch-action` styles, plus the popover may be clipped by the dialog/modal container.

### Changes

**File: `src/components/ui/command.tsx`** (line 63)
- Add `overscroll-contain` and mobile touch scrolling support to `CommandList`:
  - Change class from `"max-h-[300px] overflow-y-auto overflow-x-hidden"` to `"max-h-[300px] overflow-y-auto overflow-x-hidden overscroll-contain touch-action-pan-y"` and add inline style for `-webkit-overflow-scrolling: touch`.

**File: `src/components/ui/combobox.tsx`** (line 81)
- Ensure the `PopoverContent` doesn't clip scrollable content by adding `overflow-hidden` removal if present, and ensure proper sizing with `max-h-[60vh]` so on small screens the dropdown doesn't overflow the viewport.

### Details
- The root cause is likely that `cmdk`'s list container doesn't propagate touch events for scrolling on iOS Safari
- Adding `-webkit-overflow-scrolling: touch` and `touch-action: pan-y` on the `CommandList` enables native momentum scrolling on iOS
- `overscroll-contain` prevents scroll chaining to the parent

