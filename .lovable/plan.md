

## Fix: Package preview cards cut off on mobile

### Problem
The package cards grid container on line 659 has `pl-2 pr-0` which creates asymmetric padding, causing cards to extend to the right edge and get clipped. The parent container on line 512 has `overflow-x-hidden` which hides the overflow instead of properly containing it.

### Changes

**`src/components/Dashboard.tsx`**
- Line 659: Change the grid container from `pl-2 pr-0 sm:px-0` to `px-0` — remove the asymmetric padding that pushes cards off-screen
- Line 624: On the `TabsContent` for packages, change `px-2 sm:px-2` to `px-0` since the parent `mobile-container` already provides `px-4`

**`src/components/dashboard/CollapsiblePackageCard.tsx`**
- Line 358: Change `overflow-visible` to `overflow-hidden` on the Card wrapper to prevent content from bleeding outside card bounds on narrow viewports

