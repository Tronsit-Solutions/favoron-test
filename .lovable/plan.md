

## Fix: Card right edge clipped by Support bubble on mobile

### Problem
The "Soporte" tab is a fixed-position element on the right edge of the screen (`right: 8px`, `w-7`, z-40). The package cards extend the full width of the container and their right border/shadow gets hidden behind this floating tab.

### Solution
Add `pr-10` (40px right padding) to the packages `TabsContent` container on mobile only, so cards end before the Soporte tab. This keeps the left margin at `px-4` (from `.mobile-container`) and adds enough right clearance.

### Changes

**`src/components/Dashboard.tsx` (line ~844)**
- Change `TabsContent` for packages from:
  ```
  className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-clip"
  ```
  to:
  ```
  className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-clip pr-6 sm:pr-0"
  ```
  This adds 24px right padding on mobile to clear the Soporte tab, reverting to 0 on desktop.

**Alternative (better):** Apply the same right padding to the main container so ALL tabs benefit, not just packages:

**`src/index.css` (line ~569)** — Update `.mobile-container`:
```css
.mobile-container {
  @apply px-4 pr-10 md:px-6 lg:px-8;
}
```

Wait — this would shift everything. The tabs bar and button already align fine at `px-4`. The issue is only that the Soporte bubble overlaps card content.

**Best approach — reduce Soporte tab intrusion:**

**`src/components/SupportBubble.tsx` (line ~159)** — Make the tab narrower and more transparent, OR move it lower so it doesn't overlap card content. But that changes the design.

**Simplest correct fix:** Add right padding only to the scrollable card list area on mobile:

**`src/components/Dashboard.tsx` (line ~844)**
```
className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-clip pr-8 sm:pr-0"
```

This adds 32px right padding on mobile (enough to clear the 28px-wide Soporte tab + 8px gap), keeping cards visually aligned within the safe area. On desktop (`sm:pr-0`), no extra padding is applied.

