

## Fix: Equal Left/Right Spacing on Package Cards

### Problem
The packages tab content has `px-0` explicitly set, removing horizontal padding. The outer container uses `mobile-container` (which provides `px-4`), but the `TabsContent` for packages overrides this with `px-0`, causing cards to bleed to the right edge.

### Solution
Two changes in `src/components/Dashboard.tsx`:

1. **Line 834**: Change the packages `TabsContent` from `px-0` to `px-1` (small inner padding to work with the outer `mobile-container` padding)

2. **Line 869**: Add `px-0` to the grid container to ensure no extra offset — the spacing should come from the `TabsContent` wrapper consistently

Actually, the simpler fix: just remove `px-0` from line 834's `TabsContent` so it inherits natural spacing, or change it to `px-2` or similar to add equal breathing room.

### Files Changed
- `src/components/Dashboard.tsx` — line 834: replace `px-0` with no explicit px override (remove `px-0`), letting the parent `mobile-container` padding apply evenly

