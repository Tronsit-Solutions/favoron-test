
Fix the floating "Soporte" support bubble button to stay within the safe area on mobile.

### Changes

**`src/components/SupportBubble.tsx`**
- Line 158: Change `right-0` to `right-[max(8px,env(safe-area-inset-right))]` to respect safe area insets
- Line 161: Reduce width from `w-8` to `w-7` on mobile (`w-7 sm:w-8`) to prevent overflow on narrow viewports
- Line 163: Update hover width from `hover:w-10` to `hover:w-9 sm:hover:w-10` to match responsive sizes

This ensures the button stays 8px from the right edge minimum, plus any safe area inset required by the device (notch, home indicator area), preventing the button from being cut off.
