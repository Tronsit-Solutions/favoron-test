

## Plan: Fix card width and symmetric padding on mobile

### Problem
Cards appear cut off on the right side while having visible spacing on the left. The `container mx-auto` class applies a max-width and auto-centering that, combined with `mobile-container` (`px-4`), creates uneven visual spacing on small viewports. The cards don't stretch to fill their parent's full width symmetrically.

### Changes

**File: `src/components/Dashboard.tsx`**

1. **Line 720** — Main container div: Replace `container mx-auto mobile-container` with just `mobile-container w-full` to remove the `container` class's max-width constraint that can cause asymmetric centering on mobile. Keep `overflow-x-hidden box-border`.

2. **Line 834** — TabsContent: Ensure it has `w-full` and no extra horizontal padding (already `px-0`, confirm).

3. **Line 869** — Cards grid: Ensure `w-full` is present (already is, confirm no conflicting styles).

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

4. **Line 381** — Card component: Confirm `w-full` is set and no fixed widths. Already has `w-full max-w-full min-w-0 box-border overflow-hidden` — no change needed here.

### Summary
The root fix is removing `container mx-auto` from the main wrapper (line 720), which imposes a responsive max-width that doesn't match the viewport on certain sizes, causing the right-side clipping. Replacing with `w-full` plus the existing `mobile-container` padding (`px-4`) ensures symmetric 16px padding on both sides.

