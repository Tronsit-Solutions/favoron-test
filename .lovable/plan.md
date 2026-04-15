

## Fix: Single-tap on Package Form (mobile)

### Root cause
When the `Sheet` opens on mobile, Radix UI's internal `RemoveScroll` component sets `pointer-events: none` on `<body>` and relies on `pointer-events: auto` on the content layer to re-enable interaction. On mobile Safari, this body-level pointer-events suppression combined with scroll locking causes the **first tap to be consumed** by the browser re-establishing the pointer context — hence the "double tap" behavior.

The buttons themselves are already correct (`<button>`, `touch-manipulation`, `sm:hover:`). The problem is **above** them in the modal infrastructure.

### Fix (two changes)

**1. Add a global CSS override to prevent Radix's body pointer-events block from affecting mobile**

In `src/index.css`, add:
```css
/* Prevent Radix scroll-lock from blocking first tap on mobile */
body[data-scroll-locked] {
  pointer-events: auto !important;
}
```
This neutralizes the `pointer-events: none` that Radix applies to `<body>` when a Sheet/Dialog is open, while the overlay still handles dismiss-on-click correctly via its own event handlers.

**2. Pass `modal={false}` to the Sheet in PackageRequestForm (mobile path)**

In `src/components/PackageRequestForm.tsx`, change:
```tsx
<Sheet open={isOpen} onOpenChange={...}>
```
to:
```tsx
<Sheet open={isOpen} onOpenChange={...} modal={false}>
```
When `modal={false}`, Radix skips the `RemoveScroll` wrapper entirely — no body pointer-events manipulation, no scroll lock, no focus trap. The Sheet still renders as a visual overlay. This is the same approach used successfully in non-modal drawers.

Also render the `SheetOverlay` manually inside `SheetContent` only when `modal` is true (it's already handled by the primitive when modal=true, but we need to ensure clicking outside still closes the form).

**3. Apply the same fix to TripForm**

Same `modal={false}` change in `src/components/TripForm.tsx` for consistency.

### Files to edit
- `src/index.css` — add `body[data-scroll-locked]` override
- `src/components/PackageRequestForm.tsx` — `modal={false}` on Sheet
- `src/components/TripForm.tsx` — `modal={false}` on Sheet

### Result
Every button, select, radio, and input inside the Package and Trip forms will respond to a single tap on mobile, because Radix will no longer apply body-level pointer-events suppression.

