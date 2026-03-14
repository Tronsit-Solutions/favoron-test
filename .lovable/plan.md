

## Fix: Dropdown menu not respecting safe area insets

### Problem
The header uses `sticky top-0`, so when it sticks, it positions at the very top of the viewport — behind the notch. The body padding pushes initial content down, but sticky positioning ignores parent padding and uses viewport coordinates. The dropdown menu (portaled) then also renders behind the notch.

### Solution
Add safe area padding directly to the sticky header element and adjust its `top` position, so both the header and its dropdown respect the safe area when stuck.

### Changes

**`src/components/dashboard/DashboardHeader.tsx`** (line 63):
- Change `className="border-b bg-white sticky top-0 z-50"` to include safe-area-aware top positioning and padding:
  - Add inline style `top: env(safe-area-inset-top, 0px)` 
  - Or use a CSS class

**`src/index.css`**: 
- Remove `padding-top` from `body` (to avoid double spacing)
- Add a utility class `.sticky-safe-top` that sets `top: env(safe-area-inset-top, 0px)` and `padding-top: 0`
- Keep `padding-bottom` on body for bottom safe area

Alternatively, simpler approach:
- Keep body `padding-top` for non-sticky content pages
- On the header: use `top: env(safe-area-inset-top, 0px)` via inline style and add a matching `padding-top` so the header itself extends into the safe area with a background color covering the notch area

**Recommended approach**: 
1. Remove `padding-top` from body
2. On the header `<header>` element, add `pt-[env(safe-area-inset-top)]` via inline style: `style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}` and keep `sticky top-0` — this way the header fills the safe area with its white background
3. For pages without the header, content will still be protected by the remaining safe area utilities

