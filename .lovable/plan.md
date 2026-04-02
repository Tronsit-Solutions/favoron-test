

## Plan: Fix mobile horizontal overflow on package cards

### Problem
The package cards overflow horizontally on mobile (391px viewport). The root causes:
1. The card wrapper div (line 379) uses `pl-2` padding for the notification badge, but doesn't constrain total width properly
2. The mobile layout splits into left column (`calc(100% - 48px)`) + right column (`w-10 ml-2`), totaling `100% + ml-2(8px)` which can exceed the container
3. The parent grid (line 869) and TabsContent (line 834) use `px-1` which compounds with card padding

### Changes

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

1. **Line 379** - Card wrapper div: Change `pl-2` to `pl-0` and ensure `w-full box-border` is set. The notification badge is already absolutely positioned, so left padding is unnecessary.

2. **Line 421** - Mobile flex container: Add `max-w-full` to prevent overflow.

3. **Line 423** - Left content column: Change `calc(100% - 48px)` to `calc(100% - 44px)` to match the right column's actual width (`w-10` = 40px + `ml-2` gap = 8px = 48px is correct, but ensure the parent doesn't overflow).

4. **Line 619** - Action buttons container: Add `box-border` to ensure padding doesn't cause overflow.

5. **Line 704** - Right column: Change `ml-2` to `ml-1` to reduce total width pressure, and keep `w-10 flex-shrink-0`.

**File: `src/components/Dashboard.tsx`**

6. **Line 720** - Main container: Ensure `overflow-x-hidden` is applied.

7. **Line 834** - TabsContent for packages: Change `px-1` to `px-0` to eliminate extra padding that compounds with card margins.

8. **Line 869** - Cards grid container: Add `box-border` class.

### Summary
- Remove unnecessary left padding on card wrapper
- Reduce right column margin from `ml-2` to `ml-1`
- Remove `px-1` from TabsContent to prevent compound padding
- Add `box-border` where needed to prevent padding from expanding element widths

