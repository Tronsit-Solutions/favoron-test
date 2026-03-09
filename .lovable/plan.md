

## Fix: Notification badge clipped on mobile

The red notification badge (`absolute -top-2 -left-2`) overflows to the left of the card, but two parent containers have `overflow-x-hidden` which clips it on mobile.

### Changes in `src/components/Dashboard.tsx`

1. **Line 624** — Add left padding to the packages TabsContent so the badge has room to render without relying on overflow:

```tsx
// From:
<TabsContent value="packages" className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden px-0 sm:px-2">

// To:
<TabsContent value="packages" className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden px-2 sm:px-2">
```

2. **Line 659** — Add left padding to the grid so cards have space for the badge to overflow into:

```tsx
// From:
<div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-visible px-0">

// To:
<div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-visible pl-2 pr-0 sm:px-0">
```

This gives 8px left padding on mobile so the `-left-2` (8px) badge is fully visible without removing `overflow-x-hidden` (which prevents horizontal scroll).

