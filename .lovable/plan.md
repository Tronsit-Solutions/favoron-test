

## Fix: Notification badge clipped by parent overflow-hidden

### Problem
The red notification badge on cards uses `absolute -top-2 -left-2` but the parent grid container at line 659 of `src/components/Dashboard.tsx` has `overflow-hidden`, clipping the badge.

### Change in `src/components/Dashboard.tsx`

**Line 659** — Change `overflow-hidden` to `overflow-visible` on the packages grid container:

```tsx
// From:
<div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-hidden px-0">

// To:
<div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-visible px-0">
```

This allows the notification badge to overflow beyond the card boundaries without being clipped, while the grid layout still constrains content width.

