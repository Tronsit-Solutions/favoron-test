

## Fix: Double-tap required on mobile in Package Form

### Root Cause

The double-tap issue on mobile has two causes:

1. **Missing `touch-action: manipulation`** on raw `<button>` elements (type selection cards) and Radix UI primitives (Select, Popover). The `<Button>` component already has this, but the custom type-selection buttons and Radix triggers don't. Without it, mobile browsers apply a ~300ms delay waiting to detect double-tap-to-zoom.

2. **Sticky CSS `:hover` states** on touch devices. Classes like `hover:shadow-md`, `hover:border-primary/50` cause mobile browsers to treat the first tap as "hover" and the second as "click."

### Changes

**1. `src/index.css` — Add global mobile fix for dialogs**

Add a rule inside the `@media (max-width: 768px)` block that applies `touch-action: manipulation` to all interactive elements inside Radix dialogs, and use `@media (hover: none)` to disable hover effects on touch-only devices:

```css
/* Fix double-tap on mobile for all dialog interactive elements */
@media (hover: none) and (pointer: coarse) {
  [role="dialog"] button,
  [role="dialog"] [role="combobox"],
  [role="dialog"] [role="option"],
  [role="dialog"] select,
  [role="dialog"] input,
  [role="dialog"] a {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}
```

**2. `src/components/PackageRequestForm.tsx` — Fix type selection buttons**

- Add `touch-action: manipulation` via the `touch-manipulation` utility class to the two type-selection `<button>` elements (lines ~720 and ~754)
- Wrap hover classes with responsive prefix: change `hover:shadow-md` to `sm:hover:shadow-md` and `hover:border-primary/50` to `sm:hover:border-primary/50` so hover effects only apply on non-touch devices
- Same treatment for the step indicator hover styles (`hover:ring-2 hover:ring-primary/50` → `sm:hover:ring-2 sm:hover:ring-primary/50`)

**3. `src/components/PackageRequestForm.tsx` — Fix date picker Popover**

- Add `touch-manipulation` class to the PopoverTrigger Button (line ~856)
- Ensure the Calendar popover content has proper touch handling

**4. `src/components/ui/select.tsx` — Add touch-action to SelectTrigger**

- Add `touch-manipulation` to the SelectTrigger base classes so all Select dropdowns respond to first tap on mobile

### Why this fixes it

- `touch-action: manipulation` tells the browser to skip the double-tap-to-zoom detection, making single taps register immediately
- Moving `hover:` styles behind `sm:hover:` (or `@media (hover: hover)`) prevents mobile browsers from entering the "hover then click" two-tap cycle
- These changes are surgical and don't affect desktop behavior

