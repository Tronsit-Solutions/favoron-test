

## Plan: Fix truncated comments & color communication badges

### Changes

**1. `src/components/admin/AdminTravelerRatingsTab.tsx` (line 151)**
- Change comment cell from `truncate` to `whitespace-pre-wrap` so full comments are visible
- Remove `max-w-[200px]` constraint or keep it but allow wrapping

**2. `src/components/admin/AdminPlatformReviewsTab.tsx`**
- **Line 168**: Change communication badge from `variant="secondary"` to use color-coded variants:
  - `excellent` / `good` → `success` (green)
  - `fair` → `warning` (yellow)  
  - `poor` → `destructive` (red)
- **Line 172**: Same fix for review_text — remove `truncate` so full text is visible

